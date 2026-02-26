'use client';

import { useEffect, useRef, useState } from 'react';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGameModeStore } from '@/store/gameModeStore';
import { useAccountDataStore } from '@/store/accountDataStore';
import { useBayStore } from '@/store/bayStore';
import { useToast } from '@/contexts/ToastContext';
import BayPairingCard from '@/components/BayPairingCard';
import GuestConversionModal from '@/components/GuestConversionModal';

interface LinkedAccountsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LinkedAccountsPanel({
  isOpen,
  onClose,
}: LinkedAccountsPanelProps) {
  const { showToast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    linkedAccounts,
    unlinkAccount,
    hydrateFromAuthStore,
  } = useLinkedAccountsStore();

  const { players, removePlayer, getGuestPlays } = useGameModeStore();
  const { getVerificationStatus, markVerificationSent, markVerified, getAccountPlays } = useAccountDataStore();
  const { initBay, refreshPairingToken, isTokenValid } = useBayStore();
  
  const [convertingGuestId, setConvertingGuestId] = useState<string | null>(null);

  // Initialize bay and refresh token when drawer opens
  useEffect(() => {
    if (isOpen) {
      hydrateFromAuthStore();
      initBay();
      if (!isTokenValid()) {
        refreshPairingToken();
      }
    }
  }, [isOpen, hydrateFromAuthStore, initBay, refreshPairingToken, isTokenValid]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const guests = players.filter((p) => p.type === 'guest');

  const handleSignOut = (accountId: string) => {
    unlinkAccount(accountId);
    showToast('Account signed out', 'success');
  };

  const handleConvertGuest = (guestId: string) => {
    setConvertingGuestId(guestId);
  };

  const handleResendVerification = (accountId: string) => {
    markVerificationSent(accountId);
    showToast('Verification email sent', 'success');
  };

  const handleMarkVerified = (accountId: string) => {
    markVerified(accountId);
    showToast('Account marked as verified', 'success');
  };

  const handleRemoveGuest = (guestId: string) => {
    removePlayer(guestId);
    showToast('Guest removed', 'success');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">
              Accounts
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          {/* Linked Accounts Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Linked Accounts
            </h3>
            {linkedAccounts.length === 0 ? (
              <p className="text-gray-500 text-sm">No accounts linked</p>
            ) : (
              <div className="space-y-3">
                {linkedAccounts.map((account) => {
                  const verification = getVerificationStatus(account.id);
                  const isUnverified = account.source === 'guest-conversion' && verification && !verification.verified;
                  const playCount = getAccountPlays(account.id).length;
                  
                  return (
                    <div
                      key={account.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold">
                            {account.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {account.displayName}
                              </span>
                              {isUnverified && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                                  Unverified
                                </span>
                              )}
                              {verification?.verified && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                  Verified
                                </span>
                              )}
                            </div>
                            {account.emailMasked && (
                              <div className="text-xs text-gray-500">
                                {account.emailMasked}
                              </div>
                            )}
                            {playCount > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {playCount} {playCount === 1 ? 'play' : 'plays'} saved
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSignOut(account.id)}
                          className="px-4 py-2 text-sm text-gray-700 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Sign out
                        </button>
                      </div>
                      {isUnverified && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                          <button
                            onClick={() => handleResendVerification(account.id)}
                            className="w-full px-3 py-1.5 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Resend verification email
                          </button>
                          {process.env.NODE_ENV !== 'production' && (
                            <button
                              onClick={() => handleMarkVerified(account.id)}
                              className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              [Debug] Mark verified
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Another Account Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Link Another Account
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Link your account to save your plays and results.
            </p>
            <BayPairingCard />
          </div>

          {/* Guests Section */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Guests
            </h3>
            {guests.length === 0 ? (
              <p className="text-gray-500 text-sm">No guests</p>
            ) : (
              <div className="space-y-3">
                {guests.map((guest) => {
                  const playCount = getGuestPlays(guest.id).length;
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold">
                          {guest.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {guest.displayName}
                          </div>
                          {playCount > 0 && (
                            <div className="text-xs text-gray-500">
                              {playCount} {playCount === 1 ? 'play' : 'plays'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConvertGuest(guest.id)}
                          className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          Convert to account
                        </button>
                        <button
                          onClick={() => handleRemoveGuest(guest.id)}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guest Conversion Modal */}
      {convertingGuestId && (
        <GuestConversionModal
          isOpen={!!convertingGuestId}
          onClose={() => setConvertingGuestId(null)}
          guestId={convertingGuestId}
          guestName={players.find((p) => p.id === convertingGuestId)?.displayName || 'Guest'}
        />
      )}
    </>
  );
}
