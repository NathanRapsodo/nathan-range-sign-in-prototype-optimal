'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useToastStore } from '@/store/toastStore';

export default function PhoneAuthListener() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { setSession } = useSessionStore();
  const { setPendingToast } = useToastStore();

  useEffect(() => {
    console.log('[PhoneAuthListener] Setting up message listener');
    
    const handleMessage = async (event: MessageEvent) => {
      console.log('[PhoneAuthListener] Received message:', event.data, 'from origin:', event.origin);
      
      // Validate origin (same-origin only for prototype)
      if (event.origin !== window.location.origin) {
        console.log('[PhoneAuthListener] Origin mismatch, ignoring:', event.origin, 'expected:', window.location.origin);
        return;
      }

      if (event.data?.type === 'PHONE_AUTH_SUCCESS') {
        console.log('[PhoneAuthListener] Processing PHONE_AUTH_SUCCESS');
        const { userId, email, accessToken, refreshToken, origin, claimToken, endedSessionId } = event.data;

        // Set auth state in the main app window
        setAuth(userId, email, accessToken, refreshToken);
        console.log('[PhoneAuthListener] Auth state set');

        // Handle POST_SESSION_SAVE origin - claim/save the ended session
        if (origin === 'POST_SESSION_SAVE' && endedSessionId) {
          try {
            const claimResponse = await fetch(`/api/sessions/${endedSessionId}/claim`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });

            if (claimResponse.ok) {
              const claimData = await claimResponse.json();
              setSession(claimData.session);
              // Navigate to end screen which will show "Session saved" state
              router.replace(`/end?sessionId=${endedSessionId}`);
              return;
            }
          } catch (error) {
            console.error('[PhoneAuthListener] Failed to claim ended session:', error);
          }
        }

        // If we have a claim token, claim the session
        if (claimToken) {
          try {
            const claimResponse = await fetch('/api/sessions/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                claimToken,
                userId,
              }),
            });

            if (claimResponse.ok) {
              const claimData = await claimResponse.json();
              setSession(claimData.session);
              console.log('[PhoneAuthListener] Session claimed');
            }
          } catch (error) {
            console.error('[PhoneAuthListener] Failed to claim session:', error);
          }
        } else {
          // No claim token - create session owned by user
          try {
            const sessionResponse = await fetch('/api/sessions/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setSession(sessionData.session);
              console.log('[PhoneAuthListener] Session created');
            }
          } catch (error) {
            console.error('[PhoneAuthListener] Failed to create session:', error);
          }
        }

        // Set pending toast for START and MID_SESSION origins
        if (origin === 'START' || origin === 'MID_SESSION') {
          setPendingToast({ message: 'Signed in', type: 'success' });
          console.log('[PhoneAuthListener] Pending toast set');
        }

        // Route based on origin
        if (origin === 'POST_SESSION_SAVE') {
          // Already handled above
          return;
        }
        
        // Route to Game Modes Home (idle)
        console.log('[PhoneAuthListener] Navigating to /play');
        router.push('/play');
      }

    };

    window.addEventListener('message', handleMessage);
    console.log('[PhoneAuthListener] Message listener registered');

    return () => {
      console.log('[PhoneAuthListener] Cleaning up message listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [setAuth, setSession, setPendingToast, router]);

  return null; // This component doesn't render anything
}
