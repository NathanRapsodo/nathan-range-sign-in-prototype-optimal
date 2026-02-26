'use client';

import { useEffect, useRef, useState } from 'react';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGuestProfilesStore } from '@/store/guestProfilesStore';
import { useAccountDataStore } from '@/store/accountDataStore';
import { getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';
import { maskEmail } from '@/lib/emailMasking';

interface AddPlayerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  selectedSlotIndex: number;
  onSelectLinkedAccount: (accountId: string) => void;
  onSelectGuestProfile: (profileId: string) => void;
  onOpenSignIn: () => void;
  onOpenCreateAccount: () => void;
  onOpenAddGuest: () => void;
  alreadySelectedAccountIds: string[];
  alreadySelectedGuestProfileIds: string[];
}

export default function AddPlayerPicker({
  isOpen,
  onClose,
  anchorRef,
  selectedSlotIndex,
  onSelectLinkedAccount,
  onSelectGuestProfile,
  onOpenSignIn,
  onOpenCreateAccount,
  onOpenAddGuest,
  alreadySelectedAccountIds,
  alreadySelectedGuestProfileIds,
}: AddPlayerPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { linkedAccounts } = useLinkedAccountsStore();
  const { guestProfiles } = useGuestProfilesStore();
  const { getVerificationStatus } = useAccountDataStore();

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
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Position below the anchor, but adjust if it would go off-screen
      let top = anchorRect.bottom + 8;
      let left = anchorRect.left;
      
      // If popover would go off bottom, position above instead
      if (top + 400 > viewportHeight) {
        top = anchorRect.top - 400 - 8;
      }
      
      // If popover would go off right, adjust left
      if (left + 320 > viewportWidth) {
        left = viewportWidth - 320 - 16;
      }
      
      // If popover would go off left, adjust left
      if (left < 16) {
        left = 16;
      }
      
      popover.style.top = `${Math.max(16, top)}px`;
      popover.style.left = `${left}px`;
      popover.style.right = 'auto';
    }
  }, [isOpen, anchorRef, selectedSlotIndex]);

  if (!isOpen) return null;

  const availableLinkedAccounts = linkedAccounts.filter(
    (acc) => !alreadySelectedAccountIds.includes(acc.id)
  );
  const availableGuestProfiles = guestProfiles.filter(
    (profile) => !alreadySelectedGuestProfileIds.includes(profile.id)
  );

  return (
    <>
      {/* Transparent backdrop for outside clicks */}
      <div
        className="fixed inset-0 z-[45]"
        onClick={onClose}
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed z-[50] w-[320px] max-w-[90vw] max-h-[60vh] bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden flex flex-col"
        style={{
          top: 'auto',
          left: 'auto',
        }}
      >
        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-3">
          {/* Linked Accounts Section */}
          {availableLinkedAccounts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Linked accounts
              </h3>
              <div className="space-y-1">
                {availableLinkedAccounts.map((account) => {
                  const verification = getVerificationStatus(account.id);
                  const isUnverified = account.source === 'guest-conversion' && verification && !verification.verified;
                  
                  return (
                    <button
                      key={account.id}
                      onClick={() => {
                        onSelectLinkedAccount(account.id);
                        onClose();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-xs flex-shrink-0">
                          {account.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {account.displayName}
                          </div>
                          {account.emailMasked && (
                            <div className="text-xs text-gray-500 truncate">
                              {account.emailMasked}
                            </div>
                          )}
                        </div>
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
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guests Section */}
          {availableGuestProfiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Guests
              </h3>
              <div className="space-y-1">
                {availableGuestProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      onSelectGuestProfile(profile.id);
                      onClose();
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        style={getGuestColorStyle(profile.colorToken)}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="text-sm font-medium text-gray-900">
                        {profile.name}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {(availableLinkedAccounts.length > 0 || availableGuestProfiles.length > 0) && (
            <div className="border-t border-gray-200 my-3" />
          )}

          {/* Add Another Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Add another…
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenSignIn();
                  onClose();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">
                  Sign in / Create account
                </div>
              </button>
              <button
                onClick={() => {
                  onOpenAddGuest();
                  onClose();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">
                  Add guest
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
