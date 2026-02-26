'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { isPlayRoute } from '@/lib/routeHelpers';

// Inactivity configuration
const INACTIVITY_CONFIG = {
  timeoutMs: 10 * 60 * 1000, // 10 minutes
  warningMs: 5 * 60 * 1000, // 5 minutes
  countdownMs: 120 * 1000, // 120 seconds
};

// Global singleton to prevent multiple timers
let globalTimeoutId: NodeJS.Timeout | null = null;
let globalWarningId: NodeJS.Timeout | null = null;
let globalCountdownStartId: NodeJS.Timeout | null = null;
let globalCountdownIntervalId: NodeJS.Timeout | null = null;
let globalActivityHandler: (() => void) | null = null;
let isInitialized = false;
let lastActivityAt: number = Date.now();

// Global state for modal and countdown
let globalModalState: {
  isOpen: boolean;
  showCountdown: boolean;
  countdownRemaining: number;
} = {
  isOpen: false,
  showCountdown: false,
  countdownRemaining: 0,
};

// Callbacks for UI updates
let globalStateUpdateCallbacks: Set<() => void> = new Set();

export interface InactivityState {
  isWarningModalOpen: boolean;
  showCountdown: boolean;
  countdownRemaining: number; // in seconds
  isDemoMode: boolean;
  isOnPlayPage: boolean;
}

export function useInactivityManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { clearAuth, isAuthed } = useAuthStore();
  const { sessionId, ownerType, clearSession } = useSessionStore();
  const isProcessingRef = useRef(false);
  const wasOnPlayPageRef = useRef(false);
  
  // Demo mode detection (simple query param)
  const isDemoMode = searchParams.get('demo') === '1';
  
  // Check if currently on a Play page
  const isOnPlayPage = isPlayRoute(pathname);

  // Calculate countdown start time (120s before timeout = 8 minutes)
  const countdownStartMs = INACTIVITY_CONFIG.timeoutMs - INACTIVITY_CONFIG.countdownMs;

  // Local state for UI
  const [state, setState] = useState<InactivityState>({
    isWarningModalOpen: globalModalState.isOpen && isOnPlayPage,
    showCountdown: globalModalState.showCountdown,
    countdownRemaining: globalModalState.countdownRemaining,
    isDemoMode,
    isOnPlayPage,
  });

  // Update local state when global state changes
  useEffect(() => {
    const updateState = () => {
      setState((prevState) => {
        const newState = {
          isWarningModalOpen: globalModalState.isOpen && isOnPlayPage,
          showCountdown: globalModalState.showCountdown,
          countdownRemaining: globalModalState.countdownRemaining,
          isDemoMode,
          isOnPlayPage,
        };
        // Only update if state actually changed to prevent unnecessary re-renders
        if (
          prevState.isWarningModalOpen !== newState.isWarningModalOpen ||
          prevState.showCountdown !== newState.showCountdown ||
          prevState.countdownRemaining !== newState.countdownRemaining ||
          prevState.isDemoMode !== newState.isDemoMode ||
          prevState.isOnPlayPage !== newState.isOnPlayPage
        ) {
          return newState;
        }
        return prevState;
      });
    };
    globalStateUpdateCallbacks.add(updateState);
    
    // Reset modal state when navigating away from play page
    // Only reset if we were previously on play page and now we're not
    if (!isOnPlayPage && wasOnPlayPageRef.current && globalModalState.isOpen) {
      globalModalState.isOpen = false;
      globalModalState.showCountdown = false;
      globalModalState.countdownRemaining = 0;
      // Clear countdown interval if running
      if (globalCountdownIntervalId) {
        clearInterval(globalCountdownIntervalId);
        globalCountdownIntervalId = null;
      }
      // Notify subscribers immediately
      globalStateUpdateCallbacks.forEach((cb) => cb());
    }
    // Update ref for next render
    wasOnPlayPageRef.current = isOnPlayPage;
    
    return () => {
      globalStateUpdateCallbacks.delete(updateState);
    };
  }, [isDemoMode, isOnPlayPage]);

  // Notify all subscribers of state change
  const notifyStateChange = useCallback(() => {
    globalStateUpdateCallbacks.forEach((cb) => cb());
  }, []);

  // Handle idle timeout - idempotent
  const handleIdleTimeout = useCallback(async () => {
    // Guard against re-entrancy
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    // Close modal and stop countdown
    globalModalState.isOpen = false;
    globalModalState.showCountdown = false;
    globalModalState.countdownRemaining = 0;
    notifyStateChange();

    // Clear all timers
    if (globalTimeoutId) {
      clearTimeout(globalTimeoutId);
      globalTimeoutId = null;
    }
    if (globalWarningId) {
      clearTimeout(globalWarningId);
      globalWarningId = null;
    }
    if (globalCountdownStartId) {
      clearTimeout(globalCountdownStartId);
      globalCountdownStartId = null;
    }
    if (globalCountdownIntervalId) {
      clearInterval(globalCountdownIntervalId);
      globalCountdownIntervalId = null;
    }

    try {
      const currentSessionId = sessionId;

      // End session if active
      if (currentSessionId) {
        try {
          // End the session
          await fetch(`/api/sessions/${currentSessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endsAt: Date.now() }),
          });

          // If session is owned by a user, trigger sync
          if (ownerType === 'user') {
            try {
              await fetch('/api/sessions/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: currentSessionId }),
              });
            } catch (error) {
              console.error('Failed to sync session on timeout:', error);
              // Continue even if sync fails
            }
          }
        } catch (error) {
          console.error('Failed to end session on timeout:', error);
          // Continue even if ending fails
        }
      }

      // Clear session recovery metadata
      if (typeof window !== 'undefined' && currentSessionId) {
        try {
          const stored = localStorage.getItem('rapsodo-session-recovery');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.sessionId === currentSessionId) {
              localStorage.removeItem('rapsodo-session-recovery');
            }
          }
        } catch (error) {
          console.error('Failed to clear recovery metadata:', error);
        }
      }

      // Clear session state
      clearSession();

      // Clear auth state (logout)
      clearAuth();

      // Hard reset navigation to splash/start
      router.replace('/');
    } catch (error) {
      console.error('Error in handleIdleTimeout:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [sessionId, ownerType, clearSession, clearAuth, router, notifyStateChange]);

  // Show idle warning modal
  const showIdleWarning = useCallback(() => {
    globalModalState.isOpen = true;
    globalModalState.showCountdown = false;
    notifyStateChange();
  }, [notifyStateChange]);

  // Start countdown (only if on Play page)
  const startCountdown = useCallback(() => {
    // Clear any existing countdown interval
    if (globalCountdownIntervalId) {
      clearInterval(globalCountdownIntervalId);
      globalCountdownIntervalId = null;
    }

    if (isOnPlayPage) {
      globalModalState.isOpen = true;
      globalModalState.showCountdown = true;
      globalModalState.countdownRemaining = Math.ceil(INACTIVITY_CONFIG.countdownMs / 1000);
      notifyStateChange();

      // Start countdown interval immediately
      globalCountdownIntervalId = setInterval(() => {
        globalModalState.countdownRemaining -= 1;
        notifyStateChange();

        if (globalModalState.countdownRemaining <= 0) {
          if (globalCountdownIntervalId) {
            clearInterval(globalCountdownIntervalId);
            globalCountdownIntervalId = null;
          }
          handleIdleTimeout();
        }
      }, 1000);
    } else {
      // If not on Play page, still trigger timeout when countdown would reach 0
      // but don't show modal
      const timeoutId = setTimeout(() => {
        handleIdleTimeout();
      }, INACTIVITY_CONFIG.countdownMs);
      // Store this timeout so it can be cleared if needed
      // (For now, we'll let it run since we're not showing the modal)
    }
  }, [handleIdleTimeout, notifyStateChange, isOnPlayPage]);

  // Demo: Open modal with countdown immediately (only if on Play page)
  const demoOpenIdleModal = useCallback(() => {
    if (isOnPlayPage) {
      // Open modal and start countdown from 02:00
      startCountdown();
    }
  }, [startCountdown, isOnPlayPage]);

  // Reset all timers
  const resetAllTimers = useCallback(() => {
    // Clear existing timers
    if (globalTimeoutId) {
      clearTimeout(globalTimeoutId);
      globalTimeoutId = null;
    }
    if (globalWarningId) {
      clearTimeout(globalWarningId);
      globalWarningId = null;
    }
    if (globalCountdownStartId) {
      clearTimeout(globalCountdownStartId);
      globalCountdownStartId = null;
    }
    if (globalCountdownIntervalId) {
      clearInterval(globalCountdownIntervalId);
      globalCountdownIntervalId = null;
    }

    // Update last activity time
    lastActivityAt = Date.now();

    // Set warning timer (will only show if on Play page)
    globalWarningId = setTimeout(() => {
      showIdleWarning();
    }, INACTIVITY_CONFIG.warningMs);

    // Set countdown start timer (will only show if on Play page)
    globalCountdownStartId = setTimeout(() => {
      startCountdown();
    }, countdownStartMs);

    // Set timeout timer (always triggers regardless of page)
    globalTimeoutId = setTimeout(() => {
      handleIdleTimeout();
    }, INACTIVITY_CONFIG.timeoutMs);
  }, [countdownStartMs, showIdleWarning, startCountdown, handleIdleTimeout]);

  // Dismiss idle warning
  const dismissIdleWarning = useCallback(
    (resetTimers: boolean = true) => {
      globalModalState.isOpen = false;
      globalModalState.showCountdown = false;
      globalModalState.countdownRemaining = 0;
      notifyStateChange();

      if (globalCountdownIntervalId) {
        clearInterval(globalCountdownIntervalId);
        globalCountdownIntervalId = null;
      }

      if (resetTimers) {
        resetAllTimers();
      }
    },
    [notifyStateChange, resetAllTimers]
  );

  // Activity handler
  const handleActivity = useCallback(() => {
    // Reset timers on activity
    resetAllTimers();
  }, [resetAllTimers]);

  // Update global activity handler when it changes
  useEffect(() => {
    globalActivityHandler = handleActivity;
  }, [handleActivity]);

  // Register activity listeners (singleton pattern - only initialize once)
  useEffect(() => {
    // Only initialize once globally
    if (isInitialized) {
      // If already initialized, just update the activity handler
      globalActivityHandler = handleActivity;
      return;
    }
    isInitialized = true;

    // Activity events
    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'click',
      'touchstart',
      'scroll',
      'wheel',
      'keydown',
    ];

    // Add event listeners
    const activityListener = () => {
      if (globalActivityHandler) {
        globalActivityHandler();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, activityListener, { passive: true });
    });

    // Start the timers
    resetAllTimers();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, activityListener);
      });
      globalActivityHandler = null;
      if (globalTimeoutId) {
        clearTimeout(globalTimeoutId);
        globalTimeoutId = null;
      }
      if (globalWarningId) {
        clearTimeout(globalWarningId);
        globalWarningId = null;
      }
      if (globalCountdownStartId) {
        clearTimeout(globalCountdownStartId);
        globalCountdownStartId = null;
      }
      if (globalCountdownIntervalId) {
        clearInterval(globalCountdownIntervalId);
        globalCountdownIntervalId = null;
      }
      isInitialized = false;
    };
  }, [handleActivity, resetAllTimers]);

  // Update activity handler when it changes (for already initialized manager)
  useEffect(() => {
    if (isInitialized) {
      globalActivityHandler = handleActivity;
    }
  }, [handleActivity]);

  // Export functions for demo mode (always available)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).inactivityManager = {
        demoOpenIdleModal,
        dismissIdleWarning,
        handleIdleTimeout,
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).inactivityManager;
      }
    };
  }, [demoOpenIdleModal, dismissIdleWarning, handleIdleTimeout]);

  // Export function for external activity (e.g., shot events)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).registerExternalActivity = () => {
        if (globalActivityHandler) {
          globalActivityHandler();
        } else {
          handleActivity();
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).registerExternalActivity;
      }
    };
  }, [handleActivity]);

  return state;
}
