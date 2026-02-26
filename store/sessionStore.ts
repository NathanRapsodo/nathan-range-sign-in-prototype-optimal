import { create } from 'zustand';
import type { Session, Shot } from '@/lib/types';

export interface SessionState {
  sessionId?: string;
  ownerType?: 'guest' | 'user';
  userId?: string;
  claimToken?: string;
  claimExpiresAt?: number;
  shots: Shot[];
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'failed';
  startedAt?: number;
  provisionalClaimEmail?: string;
  provisionalClaimToken?: string;
}

interface SessionStore extends SessionState {
  setSession: (session: Session) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'synced' | 'failed') => void;
  clearSession: () => void;
  claimSession: (userId: string) => void;
  setProvisionalClaim: (email: string, claimToken?: string) => void;
  clearProvisionalClaim: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => {
  return {
    sessionId: undefined,
    ownerType: undefined,
    userId: undefined,
    claimToken: undefined,
    claimExpiresAt: undefined,
    shots: [],
    syncStatus: 'idle',
    startedAt: undefined,
    provisionalClaimEmail: undefined,
    provisionalClaimToken: undefined,
    setSession: (session: Session) => {
      const state = {
        sessionId: session.id,
        ownerType: session.ownerType,
        userId: session.userId,
        claimToken: session.claimToken,
        claimExpiresAt: session.claimExpiresAt,
        shots: session.shots,
        syncStatus: session.syncStatus,
        startedAt: session.startedAt,
      };
      set(state);
      // Persist only recovery metadata (sessionId, startedAt) - NOT full session state
      if (typeof window !== 'undefined' && session.startedAt) {
        localStorage.setItem('rapsodo-session-recovery', JSON.stringify({
          sessionId: session.id,
          startedAt: session.startedAt,
        }));
      }
    },
    setSyncStatus: (status) => set({ syncStatus: status }),
    clearSession: () => {
      set({
        sessionId: undefined,
        ownerType: undefined,
        userId: undefined,
        claimToken: undefined,
        claimExpiresAt: undefined,
        shots: [],
        syncStatus: 'idle',
        startedAt: undefined,
        provisionalClaimEmail: undefined,
        provisionalClaimToken: undefined,
      });
      // Clear recovery metadata when session ends
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rapsodo-session-recovery');
      }
    },
    setProvisionalClaim: (email: string, claimToken?: string) => {
      set({
        provisionalClaimEmail: email,
        provisionalClaimToken: claimToken,
      });
    },
    clearProvisionalClaim: () => {
      set({
        provisionalClaimEmail: undefined,
        provisionalClaimToken: undefined,
      });
    },
    claimSession: (userId: string) => {
      const current = get();
      if (current.sessionId) {
        const updated = {
          ...current,
          ownerType: 'user' as const,
          userId,
          claimToken: undefined,
          claimExpiresAt: undefined,
        };
        set(updated);
        // Update recovery metadata if exists
        if (typeof window !== 'undefined' && updated.startedAt) {
          localStorage.setItem('rapsodo-session-recovery', JSON.stringify({
            sessionId: updated.sessionId,
            startedAt: updated.startedAt,
          }));
        }
      }
    },
  };
});

// Export helper to check for recoverable session
export const getSessionRecoveryMetadata = (): { sessionId?: string; startedAt?: number } | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem('rapsodo-session-recovery');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if session is still recoverable (within 24 hours)
      if (parsed.startedAt && Date.now() - parsed.startedAt < 24 * 60 * 60 * 1000) {
        return { sessionId: parsed.sessionId, startedAt: parsed.startedAt };
      } else {
        // Session expired, clear recovery metadata
        localStorage.removeItem('rapsodo-session-recovery');
      }
    }
  } catch (error) {
    console.error('Failed to load session recovery metadata:', error);
  }
  
  return null;
};
