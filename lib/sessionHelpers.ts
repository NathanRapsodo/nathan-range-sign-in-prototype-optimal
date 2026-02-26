/**
 * Shared utility for ending sessions and routing to the appropriate end screen
 */

export interface EndSessionOptions {
  source?: 'PLAY_BUTTON' | 'MENU' | 'IDLE_TIMEOUT';
  logoutAfterDone?: boolean;
}

/**
 * Ends the current session, triggers sync if needed, and routes to the appropriate end screen
 * based on authentication state.
 */
export async function endSessionAndNavigate(
  sessionId: string | undefined,
  ownerType: 'guest' | 'user' | undefined,
  isAuthed: boolean,
  router: { push: (path: string) => void },
  options: EndSessionOptions = {}
): Promise<void> {
  const { source = 'PLAY_BUTTON', logoutAfterDone = false } = options;

  // End session if active
  if (sessionId) {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
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
            body: JSON.stringify({ sessionId }),
          });
        } catch (error) {
          console.error('Failed to sync session:', error);
          // Continue even if sync fails
        }
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      // Continue navigation even if API call fails
    }
  }

  // Route to appropriate end screen based on auth state
  // If authenticated OR session is claimed/saved (ownerType === 'user'), show signed-in experience
  if (isAuthed || ownerType === 'user') {
    // Signed-in end-of-session screen
    router.push('/end?logoutAfterDone=' + (logoutAfterDone ? '1' : '0'));
  } else {
    // Guest end-of-session screen
    router.push('/end');
  }
}
