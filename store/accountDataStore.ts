import { create } from 'zustand';

export interface AccountPlay {
  id: string;
  modeId: string;
  createdAt: number;
  source: 'guest-migration' | 'direct';
}

export interface AccountVerification {
  verified: boolean;
  verificationEmailSentAt?: number;
}

export interface AccountDataState {
  accountPlays: Record<string, AccountPlay[]>; // Map of accountId -> plays
  accountVerification: Record<string, AccountVerification>; // Map of accountId -> verification state
}

interface AccountDataStore extends AccountDataState {
  migrateGuestPlaysToAccount: (guestId: string, accountId: string, plays: Array<{ id: string; modeId: string; createdAt: number; summary?: string }>) => void;
  markVerificationSent: (accountId: string) => void;
  markVerified: (accountId: string) => void;
  getAccountPlays: (accountId: string) => AccountPlay[];
  getVerificationStatus: (accountId: string) => AccountVerification | undefined;
}

// Memory-only store (no persistence)
export const useAccountDataStore = create<AccountDataStore>((set, get) => ({
  accountPlays: {},
  accountVerification: {},

  migrateGuestPlaysToAccount: (guestId: string, accountId: string, plays: Array<{ id: string; modeId: string; createdAt: number; summary?: string }>) => {
    const state = get();
    
    const migratedPlays: AccountPlay[] = plays.map((play) => ({
      id: play.id,
      modeId: play.modeId,
      createdAt: play.createdAt,
      source: 'guest-migration' as const,
    }));

    const existingPlays = state.accountPlays[accountId] || [];
    
    set({
      accountPlays: {
        ...state.accountPlays,
        [accountId]: [...existingPlays, ...migratedPlays],
      },
    });
  },

  markVerificationSent: (accountId: string) => {
    const state = get();
    set({
      accountVerification: {
        ...state.accountVerification,
        [accountId]: {
          verified: false,
          verificationEmailSentAt: Date.now(),
        },
      },
    });
  },

  markVerified: (accountId: string) => {
    const state = get();
    const current = state.accountVerification[accountId] || { verified: false };
    set({
      accountVerification: {
        ...state.accountVerification,
        [accountId]: {
          ...current,
          verified: true,
        },
      },
    });
  },

  getAccountPlays: (accountId: string) => {
    const state = get();
    return state.accountPlays[accountId] || [];
  },

  getVerificationStatus: (accountId: string) => {
    const state = get();
    return state.accountVerification[accountId];
  },
}));
