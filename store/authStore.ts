import { create } from 'zustand';

export interface AuthState {
  isAuthed: boolean;
  userId?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthStore extends AuthState {
  setAuth: (userId: string, email: string, accessToken?: string, refreshToken?: string) => void;
  clearAuth: () => void;
}

// Memory-only auth store (no persistence)
export const useAuthStore = create<AuthStore>((set) => ({
  isAuthed: false,
  userId: undefined,
  email: undefined,
  accessToken: undefined,
  refreshToken: undefined,
  setAuth: (userId: string, email: string, accessToken?: string, refreshToken?: string) => {
    set({
      isAuthed: true,
      userId,
      email,
      accessToken: accessToken || `mock_token_${Date.now()}`,
      refreshToken: refreshToken || `mock_refresh_${Date.now()}`,
    });
    // NO localStorage persistence - memory only
  },
  clearAuth: () => {
    set({ isAuthed: false, userId: undefined, email: undefined, accessToken: undefined, refreshToken: undefined });
    // NO localStorage clearing needed - memory only
  },
}));
