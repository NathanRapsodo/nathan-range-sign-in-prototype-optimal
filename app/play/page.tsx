'use client';

import { useEffect, useState } from 'react';
import { useToastStore } from '@/store/toastStore';
import { useToast } from '@/contexts/ToastContext';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGameModeStore } from '@/store/gameModeStore';
import { useBayStore } from '@/store/bayStore';
import { maskEmail } from '@/lib/emailMasking';
import { formatDisplayName } from '@/lib/nameFormatting';
import { getGuestColorClass, getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';
import TileGrid from '@/components/TileGrid';
import BayPairingWidget from '@/components/BayPairingWidget';

export default function PlayPage() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { pendingToast, setPendingToast } = useToastStore();
  const { showToast } = useToast();
  const { linkedAccounts, linkAccount } = useLinkedAccountsStore();
  const { players } = useGameModeStore();
  const { bayId } = useBayStore();

  // Check for pending toast on mount (e.g., from auth flow)
  useEffect(() => {
    if (pendingToast) {
      // Show toast after a brief delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        showToast(pendingToast.message, pendingToast.type);
        setPendingToast(null); // Clear immediately so it can't repeat
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pendingToast, showToast, setPendingToast]);

  // Listen for pairing success from simulation windows
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('bay-pairing');

    channel.onmessage = (event) => {
      if (event.data.type === 'PAIR_SUCCESS') {
        const { bayId: messageBayId, account } = event.data;
        
        // Only process if it's for this bay
        if (messageBayId === bayId) {
          // Check if account already linked
          const existing = linkedAccounts.find(
            (acc) => acc.email === account.email || acc.id === account.id
          );

          if (!existing) {
            const formattedName = formatDisplayName(account.name);
            linkAccount({
              displayName: formattedName,
              emailMasked: maskEmail(account.email),
              source: 'simulated',
              email: account.email,
            });
            showToast(`Linked ${formattedName} to this bay`, 'success');
          }
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [bayId, linkedAccounts, linkAccount, showToast]);

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel overflow-hidden">
        <TopNav 
          activeTab="play" 
          showExit={true}
          onPopoverStateChange={setIsPopoverOpen}
        />

        <div 
          className={`flex-1 flex flex-col overflow-hidden ${isPopoverOpen ? 'pointer-events-none' : ''}`}
        >
          {/* Welcome title */}
          <div className="px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">
              WELCOME TO GOLF RANGE
            </h2>
          </div>

          {/* In the Clubhouse row - Linked accounts and guests */}
          {/* Always render container to prevent layout shift */}
          <div className="px-8 pb-4 h-[52px] flex items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                In the Clubhouse:
              </span>
              {(linkedAccounts.length > 0 || players.filter(p => p.type === 'guest').length > 0) ? (
                <>
                  {/* Linked accounts */}
                  {linkedAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-xs">
                        {account.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {account.displayName}
                      </span>
                    </div>
                  ))}
                  {/* Guest accounts */}
                  {players
                    .filter((p) => p.type === 'guest')
                    .map((guest) => (
                      <div
                        key={guest.id}
                        className="px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-2"
                      >
                        <div
                          style={guest.guestColor ? getGuestColorStyle(guest.guestColor as GuestColorToken) : undefined}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs ${
                            guest.guestColor
                              ? ''
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {guest.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {guest.displayName}
                        </span>
                      </div>
                    ))}
                </>
              ) : (
                <span className="text-sm text-gray-500 italic">
                  No golfers here
                </span>
              )}
            </div>
          </div>

          {/* Tile grid */}
          <div className="flex-1 overflow-y-auto pb-8 relative">
            <TileGrid />
          </div>
          
          {/* Bay Pairing Widget - positioned under header */}
          <BayPairingWidget />
        </div>
      </div>
    </RangeLayout>
  );
}
