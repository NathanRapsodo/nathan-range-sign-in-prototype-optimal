'use client';

import { useEffect, useState } from 'react';
import { useInactivityManager } from '@/hooks/useInactivityManager';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';

export default function IdleWarningModal() {
  const { isWarningModalOpen, showCountdown, countdownRemaining } =
    useInactivityManager();
  const router = useRouter();
  // Use selector to ensure reactivity
  const isAuthed = useAuthStore((state) => state.isAuthed);
  const { sessionId, ownerType } = useSessionStore();
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset processing state when modal opens/closes
  useEffect(() => {
    if (isWarningModalOpen) {
      setIsProcessing(false); // Reset when modal opens
    } else {
      // Also reset when modal closes
      setIsProcessing(false);
    }
  }, [isWarningModalOpen]);


  // Access inactivity manager methods via window
  const inactivityManager = typeof window !== 'undefined' ? (window as any).inactivityManager : null;

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStillHere = () => {
    if (inactivityManager) {
      inactivityManager.dismissIdleWarning(true);
    }
  };

  const handleEndSessionNow = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Close the modal first
    if (inactivityManager) {
      inactivityManager.dismissIdleWarning(false); // Don't reset timers since we're ending
    }

    try {
      const currentSessionId = sessionId;

      // End session if active
      if (currentSessionId) {
        try {
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
              console.error('Failed to sync session:', error);
            }
          }
        } catch (error) {
          console.error('Failed to end session:', error);
        }
      }

      // Navigate to session summary page with logout flag
      router.push('/end?logoutAfterDone=1');
    } catch (error) {
      console.error('Error ending session:', error);
      setIsProcessing(false);
    }
  };

  // Determine copy based on auth state - use useMemo to ensure it updates when isAuthed changes
  // Read isAuthed fresh each time the modal opens
  const bodyText = isAuthed
    ? "This is a shared device. We'll sign out soon for privacy."
    : "This is a shared device. We'll end this session soon if there's no activity.";
  
  const countdownLabel = isAuthed ? "Signing out in" : "Ending session in";
  
  const endButtonText = isAuthed
    ? "End session & sign out now"
    : "End session now";

  // Debug: Log when modal opens to verify auth state
  useEffect(() => {
    if (isWarningModalOpen) {
      console.log('[IdleModal] Modal opened - isAuthed:', isAuthed, 'bodyText:', bodyText);
    }
  }, [isWarningModalOpen, isAuthed, bodyText]);

  if (!isWarningModalOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide text-center">
            Still using this bay?
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            {bodyText}
          </p>

          {/* Countdown display */}
          {showCountdown && (
            <div className="mb-6 text-center">
              <div className="text-3xl font-bold text-rapsodo-red mb-2">
                {formatCountdown(countdownRemaining)}
              </div>
              <p className="text-sm text-gray-600">{countdownLabel}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleStillHere}
              className="w-full px-6 py-4 bg-rapsodo-red text-white font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              I'm still here
            </button>
            <button
              onClick={handleEndSessionNow}
              disabled={isProcessing}
              className="w-full px-6 py-4 bg-gray-200 text-gray-800 font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Ending session...' : endButtonText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
