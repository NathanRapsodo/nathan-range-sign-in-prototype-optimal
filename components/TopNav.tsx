'use client';

import { useState, useRef } from 'react';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGameModeStore } from '@/store/gameModeStore';
import LinkedAccountsPopover from '@/components/LinkedAccountsPopover';

interface TopNavProps {
  activeTab?: 'play' | 'sessions';
  showExit?: boolean;
  onPopoverStateChange?: (isOpen: boolean) => void;
  onRequestQRExpand?: () => void;
}

export default function TopNav({ activeTab, showExit = false, onPopoverStateChange, onRequestQRExpand }: TopNavProps) {
  const { linkedAccounts } = useLinkedAccountsStore();
  const { players } = useGameModeStore();
  const [isAccountsPopoverOpen, setIsAccountsPopoverOpen] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  
  // Count linked accounts + guests
  const guests = players.filter(p => p.type === 'guest');
  const accountCount = linkedAccounts.length + guests.length;

  const handleOpenAccounts = () => {
    setIsAccountsPopoverOpen(true);
    onPopoverStateChange?.(true);
  };

  const handleClosePopover = () => {
    setIsAccountsPopoverOpen(false);
    onPopoverStateChange?.(false);
  };

  return (
    <div className="w-full bg-range-panel border-b border-gray-300 px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        {activeTab && (
          <div className="flex gap-6">
            <button
              className={`text-lg font-bold uppercase tracking-wide ${
                activeTab === 'play'
                  ? 'text-rapsodo-red border-b-2 border-rapsodo-red pb-1'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              PLAY
            </button>
            <button
              className={`text-lg font-bold uppercase tracking-wide ${
                activeTab === 'sessions'
                  ? 'text-rapsodo-red border-b-2 border-rapsodo-red pb-1'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              SESSIONS
            </button>
          </div>
        )}
      </div>

      {showExit && (
        <div className="flex items-center gap-4 ml-3">
          {/* Green status icon */}
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white" />
          </div>
          {/* Lock icon */}
          <div className="w-8 h-8 flex items-center justify-center text-gray-600">
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          {/* Unit System pill */}
          <div className="px-4 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700">
            UNIT SYSTEM
          </div>
          {/* Account Pill Button - Opens Accounts Popover */}
          <button
            ref={accountButtonRef}
            onClick={handleOpenAccounts}
            className={`px-3 py-2 rounded-full active:scale-[0.98] transition-all duration-150 flex items-center gap-2 min-w-[100px] ${
              accountCount === 0
                ? 'bg-rapsodo-red text-white hover:bg-red-700 active:bg-red-800'
                : 'bg-white text-rapsodo-red border border-rapsodo-red hover:bg-red-50 active:bg-red-100'
            }`}
            aria-label={accountCount === 0 ? "Sign in" : "Manage users"}
          >
            {/* User icon */}
            <svg
              className={`w-5 h-5 flex-shrink-0 ${
                accountCount === 0 ? 'text-white' : 'text-rapsodo-red'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {/* Text content */}
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className={`text-sm font-medium leading-tight ${
                accountCount === 0 ? 'text-white' : 'text-rapsodo-red'
              }`}>
                {accountCount === 0 ? 'Sign in' : `${accountCount} user${accountCount !== 1 ? 's' : ''}`}
              </span>
              {accountCount > 0 && (
                <span className={`text-[10px] leading-tight ${
                  accountCount === 0 ? 'text-white/80' : 'text-rapsodo-red/80'
                }`}>
                  Tap to manage
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Linked Accounts Popover */}
      <LinkedAccountsPopover
        isOpen={isAccountsPopoverOpen}
        onClose={handleClosePopover}
        anchorRef={accountButtonRef}
        onRequestQRExpand={onRequestQRExpand}
      />
    </div>
  );
}
