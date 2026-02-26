'use client';

import { useRef } from 'react';
import { useGameModeStore, type Player } from '@/store/gameModeStore';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useAccountDataStore } from '@/store/accountDataStore';
import { getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';

interface PlayerSlotGridProps {
  onSlotClick: (slotIndex: number, ref: React.RefObject<HTMLButtonElement>) => void;
}

export default function PlayerSlotGrid({ onSlotClick }: PlayerSlotGridProps) {
  const { selectedPlayers, clearSlot } = useGameModeStore();
  const { linkedAccounts } = useLinkedAccountsStore();
  const { getVerificationStatus } = useAccountDataStore();
  const slotRefs = [
    useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null), 
    useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null),
    useRef<HTMLButtonElement>(null), useRef<HTMLButtonElement>(null)
  ];

  const handleRemove = (e: React.MouseEvent, slotIndex: number) => {
    e.stopPropagation();
    clearSlot(slotIndex);
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((slotIndex) => {
        const player = selectedPlayers[slotIndex];
        
        // Get verification status for linked accounts
        let isUnverified = false;
        if (player && player.type === 'linked' && player.linkedAccountId) {
          const account = linkedAccounts.find((acc) => (acc.userId || acc.id) === player.linkedAccountId);
          if (account) {
            const verification = getVerificationStatus(account.id);
            isUnverified = account.source === 'guest-conversion' && !!verification && !verification.verified;
          }
        }

        return (
          <div
            key={slotIndex}
            className="relative"
          >
            {player ? (
              // Filled slot - centered and visual
              <div className="bg-gray-50 rounded-lg border-2 border-gray-200 p-4 h-[180px] flex flex-col relative">
                {/* Remove button in top-right */}
                <button
                  onClick={(e) => handleRemove(e, slotIndex)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors z-10"
                  aria-label="Remove player"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Centered content */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Avatar */}
                  {player.type === 'guest' && player.guestColor ? (
                    <div
                      style={getGuestColorStyle(player.guestColor)}
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm"
                    >
                      <span className="text-white font-bold text-xl">
                        {getInitials(player.displayName)}
                      </span>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center mb-3 shadow-sm">
                      <span className="text-gray-700 font-bold text-xl">
                        {getInitials(player.displayName)}
                      </span>
                    </div>
                  )}

                  {/* Name - larger and centered */}
                  <div className="text-center mb-1">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {player.displayName}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {player.type === 'linked' ? 'Account' : 'Guest'}
                      </span>
                      {isUnverified && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Empty slot
              <button
                ref={slotRefs[slotIndex]}
                onClick={() => onSlotClick(slotIndex, slotRefs[slotIndex])}
                className="w-full bg-white rounded-lg border-2 border-dashed border-gray-300 p-4 h-[180px] flex flex-col items-center justify-center hover:border-rapsodo-red hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Add player
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
