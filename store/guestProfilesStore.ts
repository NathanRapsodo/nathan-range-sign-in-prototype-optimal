import { create } from 'zustand';
import { type GuestColorToken } from '@/lib/guestColors';

export interface GuestProfile {
  id: string;
  name: string;
  colorToken: GuestColorToken;
  createdAt: number;
}

interface GuestProfilesState {
  guestProfiles: GuestProfile[];
}

interface GuestProfilesStore extends GuestProfilesState {
  addGuestProfile: (name: string, colorToken: GuestColorToken) => GuestProfile;
  removeGuestProfile: (id: string) => void;
  getGuestProfile: (id: string) => GuestProfile | undefined;
  clearAll: () => void;
}

// Memory-only store (no persistence)
export const useGuestProfilesStore = create<GuestProfilesStore>((set, get) => ({
  guestProfiles: [],

  addGuestProfile: (name: string, colorToken: GuestColorToken) => {
    const profileId = `guest-profile-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const profile: GuestProfile = {
      id: profileId,
      name: name.trim() || 'Guest',
      colorToken,
      createdAt: Date.now(),
    };
    set((state) => ({
      guestProfiles: [...state.guestProfiles, profile],
    }));
    return profile;
  },

  removeGuestProfile: (id: string) => {
    set((state) => ({
      guestProfiles: state.guestProfiles.filter((p) => p.id !== id),
    }));
  },

  getGuestProfile: (id: string) => {
    const state = get();
    return state.guestProfiles.find((p) => p.id === id);
  },

  clearAll: () => {
    set({ guestProfiles: [] });
  },
}));
