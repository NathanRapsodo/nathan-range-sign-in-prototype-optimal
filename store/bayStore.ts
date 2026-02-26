import { create } from 'zustand';
import { useLinkedAccountsStore, type LinkedAccount } from '@/store/linkedAccountsStore';

export interface BayState {
  bayId: string | null;
  pairingCode: string | null; // 6-digit code
  pairingToken: string | null; // Short-lived token for QR URL
  tokenExpiresAt: number | null; // ms epoch
}

interface BayStore extends BayState {
  initBay: () => void;
  refreshPairingToken: () => void;
  isTokenValid: () => boolean;
  pairAccount: (account: { id: string; displayName: string; emailMasked?: string; userId?: string; email?: string }) => void;
}

// Token expiry window: 90 seconds
const TOKEN_EXPIRY_MS = 90 * 1000;

// localStorage key for persisting pairing state (shared across tabs for prototype)
const STORAGE_KEY = 'rapsodo-bay-pairing';

// Generate a 6-digit pairing code
const generatePairingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a short token for QR URL
const generatePairingToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Load pairing state from localStorage
const loadPairingState = (): Partial<BayState> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if token is still valid
      if (parsed.tokenExpiresAt && Date.now() < parsed.tokenExpiresAt) {
        return parsed;
      } else {
        // Token expired, clear storage
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('Failed to load pairing state:', error);
  }
  
  return {};
};

// Save pairing state to localStorage
const savePairingState = (state: BayState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      bayId: state.bayId,
      pairingCode: state.pairingCode,
      pairingToken: state.pairingToken,
      tokenExpiresAt: state.tokenExpiresAt,
    }));
  } catch (error) {
    console.error('Failed to save pairing state:', error);
  }
};

// Load initial state from localStorage
const initialState = loadPairingState();

export const useBayStore = create<BayStore>((set, get) => ({
  bayId: initialState.bayId || null,
  pairingCode: initialState.pairingCode || null,
  pairingToken: initialState.pairingToken || null,
  tokenExpiresAt: initialState.tokenExpiresAt || null,

  initBay: () => {
    const state = get();
    
    // First, try to load from localStorage (for cross-tab scenarios)
    const stored = loadPairingState();
    if (stored.bayId && stored.pairingToken && stored.tokenExpiresAt && Date.now() < stored.tokenExpiresAt) {
      // Valid token exists in storage, use it instead of generating new one
      if (state.pairingToken !== stored.pairingToken) {
        set({
          bayId: stored.bayId,
          pairingCode: stored.pairingCode,
          pairingToken: stored.pairingToken,
          tokenExpiresAt: stored.tokenExpiresAt,
        });
      }
      return; // Don't refresh if we have a valid token
    }
    
    // No valid stored state, initialize fresh
    if (!state.bayId) {
      // Default bay ID for prototype
      // In production, this would come from device config or env
      const newBayId = 'bay-001';
      set({ bayId: newBayId });
    }
    
    // Auto-refresh token if expired or missing
    if (!state.pairingToken || !state.isTokenValid()) {
      get().refreshPairingToken();
    }
  },

  refreshPairingToken: () => {
    const bayId = get().bayId || 'bay-001';
    const code = generatePairingCode();
    const token = generatePairingToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    const newState = {
      bayId,
      pairingCode: code,
      pairingToken: token,
      tokenExpiresAt: expiresAt,
    };

    set(newState);
    savePairingState(newState);
  },

  isTokenValid: () => {
    const state = get();
    if (!state.tokenExpiresAt || !state.pairingToken) {
      return false;
    }
    return Date.now() < state.tokenExpiresAt;
  },

  pairAccount: (accountData: { id: string; displayName: string; emailMasked?: string; userId?: string; email?: string }) => {
    // Add account to linkedAccountsStore
    const linkedAccountsStore = useLinkedAccountsStore.getState();
    
    const linkedAccount: Omit<LinkedAccount, 'id'> = {
      displayName: accountData.displayName,
      emailMasked: accountData.emailMasked,
      source: 'simulated',
      userId: accountData.userId,
      email: accountData.email,
    };

    linkedAccountsStore.linkAccount(linkedAccount);
  },
}));
