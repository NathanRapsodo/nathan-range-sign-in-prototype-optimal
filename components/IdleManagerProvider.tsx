'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGameModeStore } from '@/store/gameModeStore';
import { useGuestProfilesStore } from '@/store/guestProfilesStore';
import { useToast } from '@/contexts/ToastContext';
import IdleModal from '@/components/IdleModal';
import IdleDemoButton from '@/components/IdleDemoButton';

// Time thresholds (in milliseconds)
const PROMPT_AFTER_MS = 5 * 60 * 1000; // 5 minutes
const COUNTDOWN_AFTER_MS = 8 * 60 * 1000; // 8 minutes (3 min after prompt)
const LOGOUT_AFTER_MS = 10 * 60 * 1000; // 10 minutes total
const COUNTDOWN_DURATION_MS = 2 * 60 * 1000; // 2 minutes countdown
const PLAY_NO_PROFILE_MS = 2 * 60 * 1000; // 2 minutes for /play with no profiles

// Non-kiosk routes that should be excluded from idle management
const NON_KIOSK_ROUTES = ['/auth', '/pair', '/sim'];

type IdleState = 'active' | 'prompt' | 'countdown';

interface IdleManagerContextType {
  markActivity: (type?: 'shot' | 'default') => void;
  triggerIdlePrompt: () => void;
}

const IdleManagerContext = createContext<IdleManagerContextType | undefined>(undefined);

export function useIdleManager() {
  const context = useContext(IdleManagerContext);
  if (!context) {
    throw new Error('useIdleManager must be used within IdleManagerProvider');
  }
  return context;
}

interface IdleManagerProviderProps {
  children: ReactNode;
}

export default function IdleManagerProvider({ children }: IdleManagerProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const { linkedAccounts, clearAll: clearLinkedAccounts } = useLinkedAccountsStore();
  const { clearPlayers, clearMode } = useGameModeStore();
  const { guestProfiles, clearAll: clearGuestProfiles } = useGuestProfilesStore();

  // Check if current route is a kiosk route
  const isKioskRoute = pathname && !NON_KIOSK_ROUTES.some(route => pathname.startsWith(route));
  const isPlayPage = pathname === '/play';
  const isSplashPage = pathname === '/';

  // State
  const [idleState, setIdleState] = useState<IdleState>('active');
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  const lastActivityAtRef = useRef<number>(Date.now());
  const promptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playNoProfileTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (promptTimeoutRef.current) {
      clearTimeout(promptTimeoutRef.current);
      promptTimeoutRef.current = null;
    }
    if (countdownTimeoutRef.current) {
      clearTimeout(countdownTimeoutRef.current);
      countdownTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (playNoProfileTimeoutRef.current) {
      clearTimeout(playNoProfileTimeoutRef.current);
      playNoProfileTimeoutRef.current = null;
    }
  }, []);

  // Perform kiosk-wide sign out
  const performKioskSignOut = useCallback(async () => {
    // Show toast
    showToast('Signing out and saving results…', 'info', 3000);

    // Optional delay (500-900ms)
    await new Promise(resolve => setTimeout(resolve, 700));

    // Clear all stores
    clearLinkedAccounts();
    clearPlayers();
    clearMode();
    clearGuestProfiles();

    // Clear all timers and reset state
    clearAllTimers();
    setIdleState('active');
    setCountdownRemaining(0);
    lastActivityAtRef.current = Date.now();

    // Navigate to splash screen
    router.replace('/');
  }, [showToast, clearLinkedAccounts, clearPlayers, clearMode, clearGuestProfiles, clearAllTimers, router]);

  // Start timers based on current state
  const startTimers = useCallback(() => {
    if (!isKioskRoute || isSplashPage) {
      return; // Don't start timers on non-kiosk routes or splash
    }

    clearAllTimers();
    const now = Date.now();
    const timeSinceActivity = now - lastActivityAtRef.current;

    // Calculate remaining times
    const timeUntilPrompt = Math.max(0, PROMPT_AFTER_MS - timeSinceActivity);
    const timeUntilCountdown = Math.max(0, COUNTDOWN_AFTER_MS - timeSinceActivity);
    const timeUntilLogout = Math.max(0, LOGOUT_AFTER_MS - timeSinceActivity);

    // Set prompt timer
    if (timeUntilPrompt > 0) {
      promptTimeoutRef.current = setTimeout(() => {
        setIdleState('prompt');
      }, timeUntilPrompt);
    } else if (timeSinceActivity >= PROMPT_AFTER_MS && timeSinceActivity < COUNTDOWN_AFTER_MS) {
      // Already past prompt, show it immediately
      setIdleState('prompt');
    }

    // Set countdown timer
    if (timeUntilCountdown > 0) {
      countdownTimeoutRef.current = setTimeout(() => {
        setIdleState('countdown');
        setCountdownRemaining(Math.ceil(COUNTDOWN_DURATION_MS / 1000));
        
        // Start countdown interval
        countdownIntervalRef.current = setInterval(() => {
          setCountdownRemaining((prev) => {
            if (prev <= 1) {
              // Countdown finished, sign out
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
              performKioskSignOut();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, timeUntilCountdown);
    } else if (timeSinceActivity >= COUNTDOWN_AFTER_MS && timeSinceActivity < LOGOUT_AFTER_MS) {
      // Already past countdown start, show countdown immediately
      const remainingSeconds = Math.ceil((LOGOUT_AFTER_MS - timeSinceActivity) / 1000);
      setIdleState('countdown');
      setCountdownRemaining(remainingSeconds);
      
      countdownIntervalRef.current = setInterval(() => {
        setCountdownRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            performKioskSignOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeSinceActivity >= LOGOUT_AFTER_MS) {
      // Already past logout time, sign out immediately
      performKioskSignOut();
      return;
    }

    // Set logout timer (final fallback)
    if (timeUntilLogout > 0) {
      logoutTimeoutRef.current = setTimeout(() => {
        performKioskSignOut();
      }, timeUntilLogout);
    }
  }, [isKioskRoute, isSplashPage, clearAllTimers, performKioskSignOut]);

  // Handle activity
  const markActivity = useCallback((type: 'shot' | 'default' = 'default') => {
    if (!isKioskRoute || isSplashPage) {
      return; // Don't track activity on non-kiosk routes or splash
    }

    // Reset activity timestamp
    lastActivityAtRef.current = Date.now();

    // Reset /play no-profile timer if on play page
    if (isPlayPage && linkedAccounts.length === 0 && guestProfiles.length === 0) {
      if (playNoProfileTimeoutRef.current) {
        clearTimeout(playNoProfileTimeoutRef.current);
        playNoProfileTimeoutRef.current = null;
      }
      // Restart the 2-minute timer
      playNoProfileTimeoutRef.current = setTimeout(() => {
        router.replace('/');
      }, PLAY_NO_PROFILE_MS);
    }

    // Reset state if in prompt or countdown
    if (idleState !== 'active') {
      setIdleState('active');
      setCountdownRemaining(0);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }

    // Restart timers
    startTimers();
  }, [isKioskRoute, isSplashPage, isPlayPage, linkedAccounts.length, guestProfiles.length, idleState, startTimers, router]);

  // Handle "I'm still here" button
  const handleStillHere = useCallback(() => {
    markActivity();
  }, [markActivity]);

  // Handle "Sign out" button
  // Removed handleSignOut - users can only dismiss by clicking "I'm still here"

  // Trigger idle prompt manually (for demo)
  const triggerIdlePrompt = useCallback(() => {
    if (!isKioskRoute || isSplashPage) {
      return; // Don't trigger on non-kiosk routes or splash
    }

    // Clear existing timers
    clearAllTimers();

    // Set state to prompt immediately
    setIdleState('prompt');

    // Calculate time until countdown (3 minutes from now)
    const timeUntilCountdown = 3 * 60 * 1000; // 3 minutes
    const timeUntilLogout = 5 * 60 * 1000; // 5 minutes total (2 min countdown + 3 min)

    // Set countdown timer (3 minutes from now)
    countdownTimeoutRef.current = setTimeout(() => {
      setIdleState('countdown');
      setCountdownRemaining(Math.ceil(COUNTDOWN_DURATION_MS / 1000));
      
      // Start countdown interval
      countdownIntervalRef.current = setInterval(() => {
        setCountdownRemaining((prev) => {
          if (prev <= 1) {
            // Countdown finished, sign out
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            performKioskSignOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeUntilCountdown);

    // Set logout timer (5 minutes total)
    logoutTimeoutRef.current = setTimeout(() => {
      performKioskSignOut();
    }, timeUntilLogout);
  }, [isKioskRoute, isSplashPage, clearAllTimers, performKioskSignOut]);

  // Register activity listeners
  useEffect(() => {
    if (!isKioskRoute || isSplashPage) {
      return;
    }

    const handlePointerDown = () => markActivity();
    const handleKeyDown = () => markActivity();

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown, { passive: true });

    // Start initial timers
    startTimers();

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      clearAllTimers();
    };
  }, [isKioskRoute, isSplashPage, markActivity, startTimers, clearAllTimers]);

  // Handle /play 2-minute no-profile rule
  useEffect(() => {
    if (!isPlayPage) {
      if (playNoProfileTimeoutRef.current) {
        clearTimeout(playNoProfileTimeoutRef.current);
        playNoProfileTimeoutRef.current = null;
      }
      return;
    }

    const hasLinkedAccounts = linkedAccounts.length > 0;
    const hasGuestProfiles = guestProfiles.length > 0;

    // Clear existing timer
    if (playNoProfileTimeoutRef.current) {
      clearTimeout(playNoProfileTimeoutRef.current);
      playNoProfileTimeoutRef.current = null;
    }

    if (!hasLinkedAccounts && !hasGuestProfiles) {
      // No profiles, start 2-minute timer
      playNoProfileTimeoutRef.current = setTimeout(() => {
        router.replace('/');
      }, PLAY_NO_PROFILE_MS);
    }

    return () => {
      if (playNoProfileTimeoutRef.current) {
        clearTimeout(playNoProfileTimeoutRef.current);
        playNoProfileTimeoutRef.current = null;
      }
    };
  }, [isPlayPage, linkedAccounts.length, guestProfiles.length, router]);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if we should show the demo button
  // Show on kiosk routes except splash
  const showDemoButton = isKioskRoute && !isSplashPage;

  return (
    <IdleManagerContext.Provider value={{ markActivity, triggerIdlePrompt }}>
      {children}
            {isKioskRoute && !isSplashPage && (
              <IdleModal
                isOpen={idleState === 'prompt' || idleState === 'countdown'}
                showCountdown={idleState === 'countdown'}
                countdownText={formatCountdown(countdownRemaining)}
                onStillHere={handleStillHere}
              />
            )}
      {showDemoButton && <IdleDemoButton />}
    </IdleManagerContext.Provider>
  );
}
