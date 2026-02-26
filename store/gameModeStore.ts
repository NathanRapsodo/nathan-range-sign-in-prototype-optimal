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
    
    // Update players array: add new players, but don't remove existing ones
    // This allows players to persist in clubhouse even when slots are cleared
    const filledPlayers = newSelectedPlayers.filter((p): p is Player => p !== null);
    const existingPlayers = state.players;
    
    // Merge: keep existing players, add new ones that aren't already there
    // Use a Set to track unique player identifiers to prevent duplicates
    const existingIds = new Set<string>();
    existingPlayers.forEach((p) => {
      if (p.type === 'linked' && p.linkedAccountId) {
        existingIds.add(`linked-${p.linkedAccountId}`);
      } else if (p.type === 'guest') {
        // For guests, use the ID as the key
        existingIds.add(p.id);
        // Also check by name+color combination to catch duplicates with different IDs
        if (p.guestColor) {
          existingIds.add(`guest-${p.displayName}-${p.guestColor}`);
        }
      }
    });
    
    const mergedPlayers = [...existingPlayers];
    filledPlayers.forEach((newPlayer) => {
      let playerKey: string;
      let secondaryKey: string | null = null;
      
      if (newPlayer.type === 'linked' && newPlayer.linkedAccountId) {
        playerKey = `linked-${newPlayer.linkedAccountId}`;
      } else if (newPlayer.type === 'guest') {
        playerKey = newPlayer.id;
        // Also check by name+color for guests to prevent duplicates
        if (newPlayer.guestColor) {
          secondaryKey = `guest-${newPlayer.displayName}-${newPlayer.guestColor}`;
        }
      } else {
        return; // Skip invalid players
      }
      
      // Check both primary key and secondary key (for guests)
      const alreadyExists = existingIds.has(playerKey) || 
        (secondaryKey !== null && existingIds.has(secondaryKey));
      
      if (!alreadyExists) {
        existingIds.add(playerKey);
        if (secondaryKey) {
          existingIds.add(secondaryKey);
        }
        mergedPlayers.push(newPlayer);
      }
    });
    
    set({
      selectedPlayers: newSelectedPlayers,
      players: mergedPlayers,
    });
  },

  clearSlot: (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 8) return;
    
    const state = get();
    const newSelectedPlayers = [...state.selectedPlayers];
    newSelectedPlayers[slotIndex] = null;
    
    // Don't remove from players array - keep them for clubhouse display
    // Only update selectedPlayers
    set({
      selectedPlayers: newSelectedPlayers,
      // Keep existing players array unchanged
    });
  },

  clearAllSlots: () => {
    // Only clear selectedPlayers slots, but keep players array for clubhouse display
    set({
      selectedPlayers: [null, null, null, null, null, null, null, null],
      // Don't clear players - they should persist for clubhouse
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
