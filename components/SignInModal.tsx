'use client';

import { useEffect, useRef, useState } from 'react';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useToast } from '@/contexts/ToastContext';
import { mockAccounts } from '@/lib/mockAccounts';
import { maskEmail } from '@/lib/emailMasking';
import { formatDisplayName } from '@/lib/nameFormatting';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreateAccount: () => void;
  onAccountLinked?: (accountId: string) => void; // Callback when account is linked
  onSignedIn?: (account: { id: string; name: string; email: string }) => void; // Callback when sign-in succeeds
}

export default function SignInModal({
  isOpen,
  onClose,
  onSelectCreateAccount,
  onAccountLinked,
  onSignedIn,
}: SignInModalProps) {
  const { showToast } = useToast();
  const { linkAccount } = useLinkedAccountsStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Normalize inputs
    const emailOrUsername = email.trim().toLowerCase();
    const passwordTrimmed = password.trim();

    // Find matching mock account - check email (case-insensitive) OR name (case-insensitive) as username
    const account = mockAccounts.find((acc) => {
      const emailMatch = acc.email.toLowerCase() === emailOrUsername;
      const nameMatch = acc.name.toLowerCase() === emailOrUsername;
      return emailMatch || nameMatch;
    });

    if (!account) {
      setError('Incorrect email/password');
      setIsLoading(false);
      return;
    }

    // Validate password
    if (passwordTrimmed !== account.password) {
      setError('Incorrect email/password');
      setIsLoading(false);
      return;
    }

    // Success - link account
    try {
      const linkedAccount = linkAccount({
        id: account.id,
        displayName: formatDisplayName(account.name),
        emailMasked: maskEmail(account.email),
        source: 'manual-signin',
        email: account.email,
      });

      showToast(`Linked ${account.name}`, 'success');
      
      // Call onSignedIn callback if provided (for setup page auto-fill)
      if (onSignedIn) {
        console.log('[SignInModal] Calling onSignedIn with account:', account);
        onSignedIn({
          id: account.id,
          name: account.name,
          email: account.email,
        });
      }
      
      // Call onAccountLinked callback if provided (legacy support)
      if (onAccountLinked) {
        onAccountLinked(linkedAccount.id);
      }
      
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Failed to link account:', error);
      setError('Failed to link account. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-2xl w-full max-w-[720px] min-w-[520px] max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                Sign in
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email or username
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            {/* Create account link */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  onSelectCreateAccount();
                  onClose();
                }}
                className="text-sm text-gray-600 hover:text-rapsodo-red underline"
              >
                New here? Create account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
