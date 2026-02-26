'use client';

import { useEffect, useRef, useState } from 'react';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useAccountDataStore } from '@/store/accountDataStore';
import { useGameModeStore } from '@/store/gameModeStore';
import { useToast } from '@/contexts/ToastContext';
import { maskEmail } from '@/lib/emailMasking';
import { formatDisplayNameFromParts } from '@/lib/nameFormatting';
import AppDownloadPromoPanel from '@/components/AppDownloadPromoPanel';

type CompletionMode = 'return-to-play' | 'finish-and-signout';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  migrateFromGuestId?: string | null;
  completionMode?: CompletionMode;
  onComplete?: (result?: { accountId: string; displayName: string; email: string }) => void;
  onAccountCreated?: (accountId: string) => void; // Callback when account is created (for setup page)
  initialValues?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

type Step = 1 | 2 | 3 | 4;

export default function CreateAccountModal({
  isOpen,
  onClose,
  migrateFromGuestId,
  completionMode = 'return-to-play',
  onComplete,
  onAccountCreated,
  initialValues,
}: CreateAccountModalProps) {
  const { showToast } = useToast();
  const { linkAccount } = useLinkedAccountsStore();
  const { markVerificationSent, migrateGuestPlaysToAccount } = useAccountDataStore();
  const { getGuestPlays, clearGuestData, removePlayer } = useGameModeStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState(initialValues?.firstName || '');
  const [lastName, setLastName] = useState(initialValues?.lastName || '');
  const [email, setEmail] = useState(initialValues?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPromotions, setAcceptedPromotions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAccountEmail, setCreatedAccountEmail] = useState<string>('');
  const [createdAccountId, setCreatedAccountId] = useState<string>('');
  const [createdAccountDisplayName, setCreatedAccountDisplayName] = useState<string>('');

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFirstName(initialValues?.firstName || '');
      setLastName(initialValues?.lastName || '');
      setEmail(initialValues?.email || '');
      setPassword('');
      setConfirmPassword('');
      setAcceptedTerms(false);
      setAcceptedPromotions(false);
      setErrors({});
      setCreatedAccountEmail('');
      setCreatedAccountId('');
      setCreatedAccountDisplayName('');
    }
  }, [isOpen, initialValues]);

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setStep(3);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
      setErrors({});
    }
  };

  const handleCreate = async () => {
    if (!acceptedTerms) {
      setErrors({ terms: 'You must accept the Terms & Conditions' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate account ID
      const accountId = `acct-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const displayName = formatDisplayNameFromParts(firstName, lastName);

      // Link account
      const newAccount = linkAccount({
        id: accountId,
        displayName,
        emailMasked: maskEmail(email),
        source: 'created',
        email: email,
      });

      // Mark verification as sent
      markVerificationSent(newAccount.id);

      // Migrate guest data if provided
      if (migrateFromGuestId) {
        const guestPlays = getGuestPlays(migrateFromGuestId);
        if (guestPlays.length > 0) {
          migrateGuestPlaysToAccount(migrateFromGuestId, newAccount.id, guestPlays);
        }
        // Clear guest data and remove guest player
        clearGuestData(migrateFromGuestId);
        removePlayer(migrateFromGuestId);
      }

      // Store email, account ID, and display name for Step 4 display
      setCreatedAccountEmail(email);
      setCreatedAccountId(newAccount.id);
      setCreatedAccountDisplayName(displayName);
      
      setIsSubmitting(false);
      // Move to Step 4 instead of closing
      setStep(4);
    } catch (error) {
      console.error('Failed to create account:', error);
      setErrors({ general: 'Failed to create account. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const handleStartPlaying = () => {
    if (completionMode === 'return-to-play' && onComplete && createdAccountId && createdAccountDisplayName && createdAccountEmail) {
      // Call onComplete with full account details for return-to-play mode
      onComplete({
        accountId: createdAccountId,
        displayName: createdAccountDisplayName,
        email: createdAccountEmail,
      });
    } else if (onComplete) {
      // Fallback for other modes or if data is missing
      onComplete(createdAccountId ? { accountId: createdAccountId, displayName: createdAccountDisplayName || '', email: createdAccountEmail || '' } : undefined);
    }
    onClose();
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
            {/* Header - hide on Step 4 */}
            {step < 4 && (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                  Create account
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
            )}


            {/* Step indicator */}
            {step < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          step >= s
                            ? 'bg-rapsodo-red text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {s}
                      </div>
                      {s < 3 && (
                        <div
                          className={`w-12 h-1 mx-1 ${
                            step > s ? 'bg-rapsodo-red' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">
                  Step {step} of 3
                </p>
              </div>
            )}

            {/* Step 1: Identity */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    First name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Last name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password <span className="text-red-500">*</span>
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
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm password <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Consent */}
            {step === 3 && (
              <div className="space-y-6">
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      className="mt-1 mr-3 w-5 h-5 text-rapsodo-red border-gray-300 rounded focus:ring-rapsodo-red"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      I accept the Terms & Conditions <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {errors.terms && (
                    <p className="text-sm text-red-600 ml-8">{errors.terms}</p>
                  )}

                  <div className="flex items-start">
                    <input
                      id="promotions"
                      type="checkbox"
                      checked={acceptedPromotions}
                      onChange={(e) => setAcceptedPromotions(e.target.checked)}
                      className="mt-1 mr-3 w-5 h-5 text-rapsodo-red border-gray-300 rounded focus:ring-rapsodo-red"
                    />
                    <label htmlFor="promotions" className="text-sm text-gray-700">
                      I'd like to receive offers and promotions (optional)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left column: App promotion panel */}
                <div className="flex-shrink-0">
                  <AppDownloadPromoPanel />
                </div>

                {/* Right column: Verification + Start playing */}
                <div className="flex flex-col justify-center relative">
                  {/* Close button - positioned in top-right of right column */}
                  <button
                    onClick={onClose}
                    className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
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

                  {/* Success icon */}
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Headline - centered */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      Account created
                    </h3>
                    {createdAccountEmail && (
                      <p className="text-sm text-gray-700 mb-2">
                        We've sent a verification email to: <span className="font-medium">{maskEmail(createdAccountEmail)}</span>
                      </p>
                    )}
                    {completionMode === 'finish-and-signout' ? (
                      <>
                        <p className="text-sm text-gray-700 mb-2 font-medium">
                          Your plays and results are now saved to your account.
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          Verify your email to unlock the full experience across the app.
                        </p>
                        <p className="text-xs text-gray-500 italic">
                          You can verify later.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-600">
                        Verify your email to unlock the full experience.
                      </p>
                    )}
                  </div>

                  {/* CTA button */}
                  <div className="mt-2">
                    <button
                      onClick={handleStartPlaying}
                      className="w-full px-6 py-3 bg-rapsodo-red text-white font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                      {completionMode === 'finish-and-signout' ? 'Done' : "Let's play!"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            {step < 4 && (
              <div className="mt-8 flex gap-4">
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold uppercase tracking-wide rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-rapsodo-red text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleCreate}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-rapsodo-red text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create'}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
