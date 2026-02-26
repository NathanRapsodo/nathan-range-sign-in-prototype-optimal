import { create } from 'zustand';
import { type GuestColorToken } from '@/lib/guestColors';

export interface Player {
  id: string;
  type: 'linked' | 'guest';
  displayName: string;
  linkedAccountId?: string; // userId if type is 'linked'
  guestColor?: GuestColorToken; // Color token for guest players
}

export interface GuestPlay {
  id: string;
  modeId: string;
  createdAt: number;
  summary?: string;
}

export interface GuestData {
  plays: GuestPlay[];
}

export interface GameModeState {
  selectedModeId: string | null;
  players: Player[];
  selectedPlayers: (Player | null)[]; // Slot-based array (max 4 slots, null = empty)
  guestData: Record<string, GuestData>; // Map of guestPlayerId -> GuestData
}

interface GameModeStore extends GameModeState {
  setMode: (modeId: string) => void;
  addGuest: (name: string, color?: GuestColorToken) => Player;
  addLinkedAccount: (userId: string, email: string, displayName?: string) => Player;
  removePlayer: (playerId: string) => void;
  resetForMode: (modeId: string) => void;
  clearPlayers: () => void;
  clearMode: () => void;
  addPlayForGuests: (modeId: string, summary?: string) => void;
  clearGuestData: (guestId: string) => void;
  getGuestPlays: (guestId: string) => GuestPlay[];
  // Slot-based operations
  setPlayerAtSlot: (slotIndex: number, player: Player | null) => void;
  clearSlot: (slotIndex: number) => void;
  clearAllSlots: () => void;
  getFilledSlotsCount: () => number;
}

// Memory-only store (no persistence)
export const useGameModeStore = create<GameModeStore>((set, get) => ({
  selectedModeId: null,
  players: [],
  selectedPlayers: [null, null, null, null, null, null, null, null], // 8 slots, all empty initially
  guestData: {},

  setMode: (modeId: string) => {
    set({ selectedModeId: modeId });
  },

  addGuest: (name: string, color?: GuestColorToken) => {
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const guest: Player = {
      id: guestId,
      type: 'guest',
      displayName: name.trim() || 'Guest',
      guestColor: color,
    };
    set((state) => ({
      players: [...state.players, guest],
    }));
    return guest;
  },

  addLinkedAccount: (userId: string, email: string, displayName?: string) => {
    // Check if already added
    const existing = get().players.find((p) => p.linkedAccountId === userId);
    if (existing) {
      return existing;
    }

    // Use provided displayName or generate from email
    const finalDisplayName = displayName || (() => {
      const emailName = email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    })();
    
    const linkedPlayer: Player = {
      id: `linked-${userId}`,
      type: 'linked',
      displayName: finalDisplayName,
      linkedAccountId: userId,
    };
    set((state) => ({
      players: [...state.players, linkedPlayer],
    }));
    return linkedPlayer;
  },

  removePlayer: (playerId: string) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    }));
  },

  resetForMode: (modeId: string) => {
    set({
      selectedModeId: modeId,
      players: [],
      selectedPlayers: [null, null, null, null, null, null, null, null],
    });
  },

  clearPlayers: () => {
    set({ players: [], selectedPlayers: [null, null, null, null, null, null, null, null] });
  },

  clearMode: () => {
    set({ selectedModeId: null, players: [], selectedPlayers: [null, null, null, null, null, null, null, null] });
  },

  setPlayerAtSlot: (slotIndex: number, player: Player | null) => {
    if (slotIndex < 0 || slotIndex >= 8) return;
    
    const state = get();
    const newSelectedPlayers = [...state.selectedPlayers];
    
    // Remove player from old slot if it exists elsewhere
    if (player) {
      const existingSlotIndex = newSelectedPlayers.findIndex(
        (p) => p && (
          (p.type === 'linked' && player.type === 'linked' && p.linkedAccountId === player.linkedAccountId) ||
          (p.type === 'guest' && player.type === 'guest' && p.id === player.id)
        )
      );
      if (existingSlotIndex !== -1 && existingSlotIndex !== slotIndex) {
        newSelectedPlayers[existingSlotIndex] = null;
      }
    }
    
    newSelectedPlayers[slotIndex] = player;
    
    // Update players array to match filled slots
    const filledPlayers = newSelectedPlayers.filter((p): p is Player => p !== null);
    
    set({
      selectedPlayers: newSelectedPlayers,
      players: filledPlayers,
    });
  },

  clearSlot: (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 8) return;
    
    const state = get();
    const newSelectedPlayers = [...state.selectedPlayers];
    newSelectedPlayers[slotIndex] = null;
    
    const filledPlayers = newSelectedPlayers.filter((p): p is Player => p !== null);
    
    set({
      selectedPlayers: newSelectedPlayers,
      players: filledPlayers,
    });
  },

  clearAllSlots: () => {
    set({
      selectedPlayers: [null, null, null, null, null, null, null, null],
      players: [],
    });
  },

  getFilledSlotsCount: () => {
    const state = get();
    return state.selectedPlayers.filter((p) => p !== null).length;
  },

  addPlayForGuests: (modeId: string, summary?: string) => {
    const state = get();
    const guestPlayers = state.players.filter((p) => p.type === 'guest');
    
    if (guestPlayers.length === 0) {
      return;
    }

    const playId = `play-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const play: GuestPlay = {
      id: playId,
      modeId,
      createdAt: Date.now(),
      summary: summary || `Play in ${modeId}`,
    };

    const updatedGuestData = { ...state.guestData };
    
    guestPlayers.forEach((guest) => {
      if (!updatedGuestData[guest.id]) {
        updatedGuestData[guest.id] = { plays: [] };
      }
      updatedGuestData[guest.id].plays.push(play);
    });

    set({ guestData: updatedGuestData });
  },

  clearGuestData: (guestId: string) => {
    const state = get();
    const updatedGuestData = { ...state.guestData };
    delete updatedGuestData[guestId];
    set({ guestData: updatedGuestData });
  },

  getGuestPlays: (guestId: string) => {
    const state = get();
    return state.guestData[guestId]?.plays || [];
  },
}));
