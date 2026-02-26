'use client';

import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import LinkedAccountsPopover from '@/components/LinkedAccountsPopover';

interface TopNavProps {
  activeTab?: 'play' | 'sessions';
  showExit?: boolean;
  onPopoverStateChange?: (isOpen: boolean) => void;
}

export default function TopNav({ activeTab, showExit = false, onPopoverStateChange }: TopNavProps) {
  const { isAuthed, email } = useAuthStore();
  const [isAccountsPopoverOpen, setIsAccountsPopoverOpen] = useState(false);
  const accountIconRef = useRef<HTMLButtonElement>(null);

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
        <div className="flex items-center gap-4">
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
          {/* Account Icon - Opens Accounts Popover */}
          <div className="flex flex-col items-end">
            <button
              ref={accountIconRef}
              onClick={handleOpenAccounts}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
              aria-label="Accounts"
            >
              {!isAuthed ? (
                <svg
                  className="w-6 h-6 transition-all duration-300"
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
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium transition-all duration-300 scale-100 hover:scale-105">
                  {email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>
            {/* Signed in label below icon */}
            {isAuthed && email && (() => {
              const displayName = email.split('@')[0];
              const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
              return (
                <div className="mt-1 text-xs text-gray-600 text-center max-w-[80px] truncate">
                  Signed in as {capitalizedName}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Linked Accounts Popover */}
      <LinkedAccountsPopover
        isOpen={isAccountsPopoverOpen}
        onClose={handleClosePopover}
        anchorRef={accountIconRef}
      />
    </div>
  );
}
