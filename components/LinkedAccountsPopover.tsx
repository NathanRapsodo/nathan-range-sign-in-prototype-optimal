'use client';

import { useEffect, useRef, useState } from 'react';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGameModeStore } from '@/store/gameModeStore';
import { useAccountDataStore } from '@/store/accountDataStore';
import { useBayStore } from '@/store/bayStore';
import { useToast } from '@/contexts/ToastContext';
import GuestConversionModal from '@/components/GuestConversionModal';
import GuestSignOutUpsellModal from '@/components/GuestSignOutUpsellModal';
import ConfirmSignOutModal from '@/components/ConfirmSignOutModal';
import AddAccountChoicePopover from '@/components/AddAccountInlineMenu';
import SignInModal from '@/components/SignInModal';
import CreateAccountModal from '@/components/CreateAccountModal';
import AddGuestModal from '@/components/AddGuestModal';
import { getGuestColorClass, getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';

interface LinkedAccountsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function LinkedAccountsPopover({
  isOpen,
  onClose,
  anchorRef,
}: LinkedAccountsPopoverProps) {
  const { showToast } = useToast();
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    linkedAccounts,
    unlinkAccount,
    hydrateFromAuthStore,
  } = useLinkedAccountsStore();

  const { players, removePlayer, getGuestPlays, clearGuestData } = useGameModeStore();
  const { getVerificationStatus, markVerificationSent, markVerified, getAccountPlays } = useAccountDataStore();
  const { initBay } = useBayStore();
  
  const [convertingGuestId, setConvertingGuestId] = useState<string | null>(null);
  const [signingOutGuestId, setSigningOutGuestId] = useState<string | null>(null);
  const [migrateFromGuestId, setMigrateFromGuestId] = useState<string | null>(null);
  const [confirmingSignOutAccountId, setConfirmingSignOutAccountId] = useState<string | null>(null);
  const [isAddAccountMenuOpen, setIsAddAccountMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const addAccountButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize bay and hydrate when popover opens
  useEffect(() => {
    if (isOpen) {
      hydrateFromAuthStore();
      initBay();
    } else {
      // Close inline menu when popover closes
      setIsAddAccountMenuOpen(false);
    }
  }, [isOpen, hydrateFromAuthStore, initBay]);

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
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef]);

  // Position popover relative to anchor
  useEffect(() => {
    if (isOpen && anchorRef?.current && popoverRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popover = popoverRef.current;
      
      // Position below and aligned to right edge of anchor
      const top = anchorRect.bottom + 8;
      const right = window.innerWidth - anchorRect.right;
      
      popover.style.top = `${top}px`;
      popover.style.right = `${right}px`;
      popover.style.left = 'auto';
    }
  }, [isOpen, anchorRef]);

  if (!isOpen) return null;

  const guests = players.filter((p) => p.type === 'guest');

  const handleSignOut = (accountId: string) => {
    setConfirmingSignOutAccountId(accountId);
  };

  const handleConfirmSignOut = (accountId: string) => {
    unlinkAccount(accountId);
    const account = linkedAccounts.find((acc) => acc.id === accountId);
    showToast(`Good game — you've been signed out.`, 'success');
    setConfirmingSignOutAccountId(null);
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

  const handleGuestSignOut = (guestId: string) => {
    setSigningOutGuestId(guestId);
  };

  const handleSignOutAnyway = () => {
    if (!signingOutGuestId) return;
    // Clear guest data
    clearGuestData(signingOutGuestId);
    // Remove guest player
    removePlayer(signingOutGuestId);
    showToast('Guest signed out', 'success');
    setSigningOutGuestId(null);
  };

  const handleCreateAccountFromGuest = () => {
    if (!signingOutGuestId) return;
    setMigrateFromGuestId(signingOutGuestId);
    setSigningOutGuestId(null);
    setIsCreateAccountOpen(true);
  };

  const handleGuestSignOutComplete = (result?: { accountId: string; displayName: string; email: string }) => {
    // Ensure guest is fully signed out after account creation
    if (migrateFromGuestId) {
      // Guest should already be removed by migration, but ensure cleanup
      const guest = players.find((p) => p.id === migrateFromGuestId);
      if (guest) {
        clearGuestData(migrateFromGuestId);
        removePlayer(migrateFromGuestId);
      }
      setMigrateFromGuestId(null);
    }
    
    // Unlink the newly created account (sign out intent)
    if (result?.accountId) {
      unlinkAccount(result.accountId);
    }
    
    showToast('Signed out', 'success');
  };

  return (
    <>
      {/* Transparent backdrop for outside clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed z-50 w-[360px] max-w-[90vw] max-h-[45vh] bg-white shadow-2xl rounded-lg border border-gray-200 overflow-hidden flex flex-col"
        style={{
          top: 'auto',
          right: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
            Accounts
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
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

        {/* Add Account CTA */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <button
            ref={addAccountButtonRef}
            onClick={() => setIsAddAccountMenuOpen(!isAddAccountMenuOpen)}
            className="w-full px-6 py-3 bg-rapsodo-red text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Add account
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4">
          {/* Linked Accounts Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Linked Accounts
            </h3>
            {linkedAccounts.length === 0 ? (
              <p className="text-gray-500 text-sm">No accounts linked</p>
            ) : (
              <div className="space-y-2">
                {linkedAccounts.map((account) => {
                  const verification = getVerificationStatus(account.id);
                  const isUnverified = account.source === 'guest-conversion' && verification && !verification.verified;
                  const playCount = getAccountPlays(account.id).length;
                  
                  return (
                    <div
                      key={account.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm flex-shrink-0">
                            {account.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm truncate">
                                {account.displayName}
                              </span>
                              {isUnverified && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded flex-shrink-0">
                                  Unverified
                                </span>
                              )}
                              {verification?.verified && (
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded flex-shrink-0">
                                  Verified
                                </span>
                              )}
                            </div>
                            {account.emailMasked && (
                              <div className="text-xs text-gray-500 truncate">
                                {account.emailMasked}
                              </div>
                            )}
                            {playCount > 0 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {playCount} {playCount === 1 ? 'play' : 'plays'} saved
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSignOut(account.id)}
                          className="px-3 py-1.5 text-xs text-gray-700 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-2"
                        >
                          Sign out
                        </button>
                      </div>
                      {isUnverified && (
                        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5">
                          <button
                            onClick={() => handleResendVerification(account.id)}
                            className="w-full px-2 py-1 text-xs text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Resend verification email
                          </button>
                          {process.env.NODE_ENV !== 'production' && (
                            <button
                              onClick={() => handleMarkVerified(account.id)}
                              className="w-full px-2 py-1 text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
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

          {/* Guests Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Guests
            </h3>
            {guests.length === 0 ? (
              <p className="text-gray-500 text-sm">No guests</p>
            ) : (
              <div className="space-y-2">
                {guests.map((guest) => {
                  const playCount = getGuestPlays(guest.id).length;
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          style={guest.guestColor ? getGuestColorStyle(guest.guestColor as GuestColorToken) : undefined}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                            guest.guestColor
                              ? ''
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {guest.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">
                            {guest.displayName}
                          </div>
                          {playCount > 0 && (
                            <div className="text-xs text-gray-500">
                              {playCount} {playCount === 1 ? 'play' : 'plays'}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleGuestSignOut(guest.id)}
                        className="px-3 py-1.5 text-xs text-gray-700 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0 ml-2"
                      >
                        Sign out
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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

        {/* Sign In Modal */}
        <SignInModal
          isOpen={isSignInOpen}
          onClose={() => {
            setIsSignInOpen(false);
            setIsAddAccountMenuOpen(false);
          }}
          onSelectCreateAccount={() => {
            setIsSignInOpen(false);
            setIsCreateAccountOpen(true);
          }}
        />

        {/* Create Account Modal */}
        <CreateAccountModal
          isOpen={isCreateAccountOpen}
          onClose={() => {
            setIsCreateAccountOpen(false);
            setIsAddAccountMenuOpen(false);
            setMigrateFromGuestId(null);
          }}
          migrateFromGuestId={migrateFromGuestId}
          completionMode={migrateFromGuestId ? 'finish-and-signout' : 'return-to-play'}
          onComplete={migrateFromGuestId ? handleGuestSignOutComplete : undefined}
          initialValues={migrateFromGuestId ? (() => {
            const guest = players.find((p) => p.id === migrateFromGuestId);
            if (guest) {
              const nameParts = guest.displayName.trim().split(/\s+/);
              return {
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
              };
            }
            return undefined;
          })() : undefined}
        />

        {/* Guest Sign Out Upsell Modal */}
        {signingOutGuestId && (() => {
          const guest = players.find((p) => p.id === signingOutGuestId);
          const playCount = guest ? getGuestPlays(guest.id).length : 0;
          return (
            <GuestSignOutUpsellModal
              isOpen={!!signingOutGuestId}
              onClose={() => setSigningOutGuestId(null)}
              guestName={guest?.displayName || 'Guest'}
              playCount={playCount}
              onCreateAccount={handleCreateAccountFromGuest}
              onSignOutAnyway={handleSignOutAnyway}
            />
          );
        })()}

        {/* Confirm Sign Out Modal */}
        {confirmingSignOutAccountId && (() => {
          const account = linkedAccounts.find((acc) => acc.id === confirmingSignOutAccountId);
          return (
            <ConfirmSignOutModal
              isOpen={!!confirmingSignOutAccountId}
              onClose={() => setConfirmingSignOutAccountId(null)}
              accountName={account?.displayName || 'Account'}
              onConfirm={() => handleConfirmSignOut(confirmingSignOutAccountId)}
            />
          );
        })()}

        {/* Add Guest Modal */}
        <AddGuestModal
          isOpen={isAddGuestOpen}
          onClose={() => {
            setIsAddGuestOpen(false);
            setIsAddAccountMenuOpen(false);
          }}
        />

        {/* Add Account Choice Popover */}
        <AddAccountChoicePopover
          isOpen={isAddAccountMenuOpen}
          onClose={() => setIsAddAccountMenuOpen(false)}
          onCloseParent={onClose}
          anchorRef={addAccountButtonRef}
          onSelectSignIn={() => {
            setIsAddAccountMenuOpen(false);
            setIsSignInOpen(true);
          }}
          onSelectAddGuest={() => {
            setIsAddAccountMenuOpen(false);
            setIsAddGuestOpen(true);
          }}
        />
      </div>
    </>
  );
}
