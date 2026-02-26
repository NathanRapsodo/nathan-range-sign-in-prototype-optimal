'use client';

import { useState } from 'react';
import { useGameModeStore } from '@/store/gameModeStore';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useAccountDataStore } from '@/store/accountDataStore';
import { useToast } from '@/contexts/ToastContext';

interface GuestConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string;
  guestName: string;
}

export default function GuestConversionModal({
  isOpen,
  onClose,
  guestId,
  guestName,
}: GuestConversionModalProps) {
  const { showToast } = useToast();
  const { getGuestPlays, clearGuestData, removePlayer } = useGameModeStore();
  const { linkAccount } = useLinkedAccountsStore();
  const { migrateGuestPlaysToAccount, markVerificationSent } = useAccountDataStore();

  const [name, setName] = useState(guestName);
  const [email, setEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const guestPlays = getGuestPlays(guestId);
  const playCount = guestPlays.length;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter a name', 'error');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }

    if (!acceptedTerms) {
      showToast('Please accept the terms and privacy policy', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate account ID
      const accountId = `acct-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Mask email
      const emailParts = email.split('@');
      const emailMasked = `${emailParts[0].substring(0, 3)}***@${emailParts[1].substring(0, 3)}***.${emailParts[1].split('.').pop()}`;

      // Create linked account - pass ID explicitly
      const newAccount = linkAccount({
        id: accountId,
        displayName: name.trim(),
        emailMasked,
        source: 'guest-conversion',
        email: email,
      });
      
      // Use the account ID from the returned account
      const finalAccountId = newAccount.id;

      // Migrate guest plays
      if (guestPlays.length > 0) {
        migrateGuestPlaysToAccount(guestId, finalAccountId, guestPlays);
      }

      // Mark verification email as sent
      markVerificationSent(finalAccountId);

      // Clear guest data and remove guest player
      clearGuestData(guestId);
      removePlayer(guestId);

      setIsSubmitting(false);
      setIsSuccess(true);
      showToast('Account created successfully', 'success');
    } catch (error) {
      console.error('Failed to convert guest:', error);
      showToast('Failed to create account. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setIsSuccess(false);
    setName(guestName);
    setEmail('');
    setAcceptedTerms(false);
    setMarketingOptIn(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {!isSuccess ? (
              <>
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Save your results
                  </h2>
                  {playCount > 0 && (
                    <p className="text-sm text-gray-600">
                      {playCount} {playCount === 1 ? 'play' : 'plays'} will be saved to your account.
                    </p>
                  )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                      placeholder="you@example.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      We'll send a verification email to confirm your account.
                    </p>
                  </div>

                  {/* Terms checkbox */}
                  <div className="flex items-start">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      className="mt-1 mr-3 w-4 h-4 text-rapsodo-red border-gray-300 rounded focus:ring-rapsodo-red"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I accept the Terms of Service and Privacy Policy{' '}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Marketing opt-in */}
                  <div className="flex items-start">
                    <input
                      id="marketing"
                      type="checkbox"
                      checked={marketingOptIn}
                      onChange={(e) => setMarketingOptIn(e.target.checked)}
                      className="mt-1 mr-3 w-4 h-4 text-rapsodo-red border-gray-300 rounded focus:ring-rapsodo-red"
                    />
                    <label htmlFor="marketing" className="text-sm text-gray-700">
                      Send me updates and tips (optional)
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold uppercase tracking-wide rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Not now
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-rapsodo-red text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : 'Create account'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* Success state */}
                <div className="text-center">
                  <div className="mb-4">
                    <svg
                      className="mx-auto h-16 w-16 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                    Account Created
                  </h2>
                  <p className="text-gray-600 mb-2">
                    Verify your email to access full history.
                  </p>
                  {playCount > 0 && (
                    <p className="text-sm text-gray-500 mb-6">
                      {playCount} {playCount === 1 ? 'play' : 'plays'} migrated
                    </p>
                  )}
                  <button
                    onClick={handleDone}
                    className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
