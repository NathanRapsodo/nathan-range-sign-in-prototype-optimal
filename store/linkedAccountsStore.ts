import { create } from 'zustand';
import { useAuthStore } from '@/store/authStore';

export interface LinkedAccount {
  id: string;
  displayName: string;
  emailMasked?: string; // e.g., "user***@example.com"
  source?: 'authStore' | 'simulated' | 'guest-conversion' | 'manual-signin' | 'created';
  userId?: string; // For reference to authStore userId
  email?: string; // Full email if available
}

export interface LinkedAccountsState {
  linkedAccounts: LinkedAccount[];
  activeAccountId?: string;
}

interface LinkedAccountsStore extends LinkedAccountsState {
  linkAccount: (account: Omit<LinkedAccount, 'id'> | LinkedAccount) => LinkedAccount;
  unlinkAccount: (accountId: string) => void;
  clearAll: () => void;
  hydrateFromAuthStore: () => void;
  setActiveAccount: (accountId: string | undefined) => void;
}

// Memory-only store (no persistence)
export const useLinkedAccountsStore = create<LinkedAccountsStore>((set, get) => ({
  linkedAccounts: [],
  activeAccountId: undefined,

  linkAccount: (accountData: Omit<LinkedAccount, 'id'> | LinkedAccount) => {
    const state = get();
    
    // Check if ID is already provided
    const hasId = 'id' in accountData && accountData.id;
    
    // Check for duplicates by userId or email
    const existing = state.linkedAccounts.find(
      (acc) =>
        (accountData.userId && acc.userId === accountData.userId) ||
        (accountData.email && acc.email === accountData.email) ||
        (hasId && acc.id === accountData.id)
    );

    if (existing) {
      return existing;
    }

    // Generate ID if not provided
    const id = hasId
      ? accountData.id
      : accountData.userId
      ? `linked-${accountData.userId}`
      : accountData.source === 'guest-conversion'
      ? `acct-${Date.now()}-${Math.random().toString(36).substring(7)}`
      : `linked-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const newAccount: LinkedAccount = {
      id,
      ...accountData,
    };

    // Add to front (most recently linked first)
    set({
      linkedAccounts: [newAccount, ...state.linkedAccounts],
    });

    return newAccount;
  },

  unlinkAccount: (accountId: string) => {
    set((state) => ({
      linkedAccounts: state.linkedAccounts.filter((acc) => acc.id !== accountId),
      // Clear active account if it was unlinked
      activeAccountId:
        state.activeAccountId === accountId ? undefined : state.activeAccountId,
    }));
  },

  clearAll: () => {
    set({
      linkedAccounts: [],
      activeAccountId: undefined,
    });
  },

  hydrateFromAuthStore: () => {
    const authState = useAuthStore.getState();

    if (authState.isAuthed && authState.userId && authState.email) {
      const state = get();
      
      // Check if already linked
      const alreadyLinked = state.linkedAccounts.some(
        (acc) => acc.userId === authState.userId
      );

      if (!alreadyLinked) {
        const displayName = authState.email.split('@')[0];
        const capitalizedName =
          displayName.charAt(0).toUpperCase() + displayName.slice(1);
        const emailMasked = `${authState.email.split('@')[0].substring(0, 3)}***@${authState.email.split('@')[1]}`;

        get().linkAccount({
          displayName: capitalizedName,
          emailMasked,
          source: 'authStore',
          userId: authState.userId,
          email: authState.email,
        });
      }
    }
  },

  setActiveAccount: (accountId: string | undefined) => {
    set({ activeAccountId: accountId });
  },
}));
