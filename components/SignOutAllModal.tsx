'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGameModeStore } from '@/store/gameModeStore';
import { useGuestProfilesStore } from '@/store/guestProfilesStore';
import { useToast } from '@/contexts/ToastContext';
import CreateAccountModal from '@/components/CreateAccountModal';
import { getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';
import { maskEmail } from '@/lib/emailMasking';

interface SignOutAllModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModalLinkedAccount {
  id: string;
  displayName: string;
  emailMasked?: string;
  email?: string;
  guestColor?: GuestColorToken;
}

interface ModalGuest {
  id: string;
  displayName: string;
  guestColor?: GuestColorToken;
}

export default function SignOutAllModal({ isOpen, onClose }: SignOutAllModalProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { linkedAccounts, clearAll: clearLinkedAccounts } = useLinkedAccountsStore();
  const { players, clearPlayers, getGuestPlays } = useGameModeStore();
  const { clearAll: clearGuestProfiles } = useGuestProfilesStore();
  
  // Local modal state - tracks accounts/guests as they're converted
  const [modalLinkedAccounts, setModalLinkedAccounts] = useState<ModalLinkedAccount[]>([]);
  const [modalGuests, setModalGuests] = useState<ModalGuest[]>([]);
  const [creatingAccountForGuestId, setCreatingAccountForGuestId] = useState<string | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  // Store guest info before account creation (in case guest is removed from store)
  const [guestInfoForCreation, setGuestInfoForCreation] = useState<ModalGuest | null>(null);

  // Initialize modal state from stores when modal opens (only on open, not on every change)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (isOpen && !hasInitializedRef.current) {
      // Initialize linked accounts
      const initialLinkedAccounts: ModalLinkedAccount[] = linkedAccounts.map(acc => ({
        id: acc.id,
        displayName: acc.displayName,
        emailMasked: acc.emailMasked,
        email: acc.email,
        guestColor: acc.guestColor,
      }));
      
      // Initialize guests from players
      const initialGuests: ModalGuest[] = players
        .filter(p => p.type === 'guest')
        .map(guest => ({
          id: guest.id,
          displayName: guest.displayName,
          guestColor: guest.guestColor as GuestColorToken | undefined,
        }));
      
      setModalLinkedAccounts(initialLinkedAccounts);
      setModalGuests(initialGuests);
      hasInitializedRef.current = true;
    } else if (!isOpen) {
      // Reset flag when modal closes
      hasInitializedRef.current = false;
    }
  }, [isOpen, linkedAccounts, players]);

  // Sync modal linked accounts with store when new accounts are added (e.g., from guest conversion)
  // This should ADD accounts from store, but PRESERVE accounts that were added to modal but aren't in store
  useEffect(() => {
    if (isOpen && !isCreateAccountOpen && hasInitializedRef.current) {
      // Find any accounts in store that aren't in modal linked accounts
      setModalLinkedAccounts(prev => {
        const newAccounts = linkedAccounts.filter(
          storeAcc => !prev.some(modalAcc => modalAcc.id === storeAcc.id || modalAcc.email === storeAcc.email)
        );
        
        if (newAccounts.length > 0) {
          // Add new accounts to modal linked accounts (preserve existing ones)
          return [
            ...prev,
            ...newAccounts.map(acc => ({
              id: acc.id,
              displayName: acc.displayName,
              emailMasked: acc.emailMasked,
              email: acc.email,
              guestColor: acc.guestColor,
            })),
          ];
        }
        
        return prev; // Preserve existing accounts even if not in store
      });
    }
  }, [isOpen, isCreateAccountOpen, linkedAccounts]);

  // Sync guests from store, but preserve guests that are being converted
  useEffect(() => {
    if (isOpen && !isCreateAccountOpen && hasInitializedRef.current) {
      setModalGuests(prev => {
        // Get current guests from store
        const currentStoreGuests = players
          .filter(p => p.type === 'guest')
          .map(guest => ({
            id: guest.id,
            displayName: guest.displayName,
            guestColor: guest.guestColor as GuestColorToken | undefined,
          }));
        
        // If a guest is being converted, preserve it in the list even if removed from store
        // Otherwise, sync with store
        if (creatingAccountForGuestId) {
          // Keep the guest being converted, merge with store guests
          const guestBeingConverted = prev.find(g => g.id === creatingAccountForGuestId);
          const otherGuests = currentStoreGuests.filter(g => g.id !== creatingAccountForGuestId);
          return guestBeingConverted ? [guestBeingConverted, ...otherGuests] : currentStoreGuests;
        }
        
        return currentStoreGuests;
      });
    }
  }, [isOpen, isCreateAccountOpen, players, creatingAccountForGuestId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCreateAccountOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, isCreateAccountOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        isOpen &&
        !isCreateAccountOpen
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, isCreateAccountOpen]);

  const handleCreateAccountForGuest = (guestId: string) => {
    // Store guest info before account creation (in case guest gets removed from store)
    const guest = modalGuests.find(g => g.id === guestId);
    if (guest) {
      setGuestInfoForCreation(guest);
    }
    setCreatingAccountForGuestId(guestId);
    setIsCreateAccountOpen(true);
  };

  const handleAccountCreated = (result?: { accountId: string; displayName: string; email: string }) => {
    console.log('[SignOutAllModal] handleAccountCreated called:', {
      result,
      creatingAccountForGuestId,
      guestInfoForCreation,
    });
    
    if (!creatingAccountForGuestId || !result) {
      // Reset state even if no result
      setCreatingAccountForGuestId(null);
      setGuestInfoForCreation(null);
      setIsCreateAccountOpen(false);
      return;
    }
    
    // Use stored guest info (from before account creation) or try to find in modalGuests
    const guest = guestInfoForCreation || modalGuests.find(g => g.id === creatingAccountForGuestId);
    
    // Remove guest from modal guests list
    setModalGuests(prev => prev.filter(g => g.id !== creatingAccountForGuestId));
    
    // Get the latest state from the store (may not be updated in hook yet)
    const { linkedAccounts: currentLinkedAccounts } = useLinkedAccountsStore.getState();
    console.log('[SignOutAllModal] Current linked accounts in store:', currentLinkedAccounts.map(acc => ({ id: acc.id, email: acc.email })));
    
    // Find the newly created account from the store
    const newlyCreatedAccount = currentLinkedAccounts.find(
      acc => acc.id === result.accountId || acc.email === result.email
    );
    console.log('[SignOutAllModal] Found account in store:', newlyCreatedAccount);
    
    // Add account to modal linked accounts list
    // The account should always be in the store now (we changed CreateAccountModal to always link)
    // But if it's not found, use result data as fallback
    setModalLinkedAccounts(prev => {
      // Check if already in list to avoid duplicates
      const exists = prev.some(acc => acc.id === result.accountId || acc.email === result.email);
      if (exists) {
        console.log('[SignOutAllModal] Account already in modal linked accounts, skipping');
        return prev;
      }
      
      if (newlyCreatedAccount) {
        // Account found in store - use store data
        console.log('[SignOutAllModal] Adding account from store to modal linked accounts:', newlyCreatedAccount);
        return [
          ...prev,
          {
            id: newlyCreatedAccount.id,
            displayName: newlyCreatedAccount.displayName,
            emailMasked: newlyCreatedAccount.emailMasked,
            email: newlyCreatedAccount.email,
            guestColor: newlyCreatedAccount.guestColor || guest?.guestColor, // Preserve guest color
          },
        ];
      } else {
        // Account not in store - this shouldn't happen now, but use result data as fallback
        console.warn('[SignOutAllModal] Account not found in store, using result data as fallback:', result);
        return [
          ...prev,
          {
            id: result.accountId,
            displayName: result.displayName,
            emailMasked: maskEmail(result.email),
            email: result.email,
            guestColor: guest?.guestColor, // Preserve guest color
          },
        ];
      }
    });
    
    console.log('[SignOutAllModal] After adding account, modalLinkedAccounts count:', 
      useLinkedAccountsStore.getState().linkedAccounts.length);
    
    // Reset state
    setCreatingAccountForGuestId(null);
    setGuestInfoForCreation(null);
    setIsCreateAccountOpen(false);
  };

  const handleCompleteSignOut = () => {
    // Clear all stores
    clearLinkedAccounts();
    clearPlayers(); // This clears both players and selectedPlayers
    clearGuestProfiles();
    
    // Close modal
    onClose();
    
    // Navigate to splash
    router.push('/');
    
    // Show toast
    showToast('Signed out — thanks for playing.', 'success');
  };

  if (!isOpen) return null;

  const guestForAccountCreation = modalGuests.find(g => g.id === creatingAccountForGuestId);
  const guestFirstName = guestForAccountCreation
    ? guestForAccountCreation.displayName.trim().split(/\s+/)[0] || ''
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[80]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-2xl w-full max-w-[600px] max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  End session
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  This will sign out all players from this bay.
                </p>
              </div>
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

            {/* Linked Accounts Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                Linked accounts
              </h3>
              {modalLinkedAccounts.length === 0 ? (
                <p className="text-gray-500 text-sm">No linked accounts</p>
              ) : (
                <>
                  <div className="space-y-2 mb-2">
                    {modalLinkedAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3"
                      >
                        <div
                          style={account.guestColor ? getGuestColorStyle(account.guestColor) : undefined}
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                            account.guestColor
                              ? 'text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {account.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">
                            {account.displayName}
                          </div>
                          {account.emailMasked && (
                            <div className="text-xs text-gray-500 truncate">
                              {account.emailMasked}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Their plays and results will remain saved to their account.
                  </p>
                </>
              )}
            </div>

            {/* Guests Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                Guests
              </h3>
              {modalGuests.length === 0 ? (
                <p className="text-gray-500 text-sm">No guests</p>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Create an account to save your plays and results across bays.
                  </p>
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-rapsodo-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Keep plays & results</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-rapsodo-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Track progress over time</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <svg className="w-4 h-4 text-rapsodo-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Pick up on any bay</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {modalGuests.map((guest) => {
                      const playCount = getGuestPlays(guest.id).length;
                      return (
                        <div
                          key={guest.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              style={guest.guestColor ? getGuestColorStyle(guest.guestColor) : undefined}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 ${
                                guest.guestColor
                                  ? ''
                                  : 'bg-gray-300 text-gray-700'
                              }`}
                            >
                              {guest.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 text-sm truncate">
                                {guest.displayName}
                              </div>
                              {playCount > 0 && (
                                <div className="text-xs text-gray-500">
                                  {playCount} {playCount === 1 ? 'play' : 'plays'} saved
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleCreateAccountForGuest(guest.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-rapsodo-red rounded hover:bg-red-700 transition-colors flex-shrink-0"
                          >
                            Create account
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Without an account, guest history isn't kept.
                  </p>
                </>
              )}
            </div>

            {/* Complete Sign Out Button */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold uppercase tracking-wide rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSignOut}
                className="flex-1 px-6 py-3 bg-rapsodo-red text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors"
              >
                Complete sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Account Modal for Guest */}
      {creatingAccountForGuestId && (
        <CreateAccountModal
          isOpen={isCreateAccountOpen}
          onClose={() => {
            setIsCreateAccountOpen(false);
            setCreatingAccountForGuestId(null);
          }}
          migrateFromGuestId={creatingAccountForGuestId}
          completionMode="finish-and-signout"
          linkToBayAfterCreate={false}
          elevatedZIndex={true}
          guestColor={guestForAccountCreation?.guestColor}
          onComplete={handleAccountCreated}
          initialValues={{
            firstName: guestFirstName,
            lastName: '',
          }}
        />
      )}
    </>
  );
}
