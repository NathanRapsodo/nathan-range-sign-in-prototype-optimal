'use client';

/**
 * Pairing simulation page (phone-side)
 * 
 * NOTE: In this prototype, /pair shares the same Zustand stores as the device UI.
 * This is acceptable for simulation purposes. In production, this would be a
 * separate mobile app/web interface that communicates with the bay via API.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useBayStore } from '@/store/bayStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';

function PairPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const bayParam = searchParams.get('bay');
  const { showToast } = useToast();

  const { bayId, pairingCode, pairingToken, tokenExpiresAt, isTokenValid, pairAccount, initBay } = useBayStore();
  const { isAuthed, userId, email } = useAuthStore();

  const [pinCode, setPinCode] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isPaired, setIsPaired] = useState(false);

  // Initialize bay on mount - this will load from localStorage
  useEffect(() => {
    initBay();
  }, [initBay]);

  // Validate token - check both store and localStorage
  const [isValid, setIsValid] = useState(false);
  
  useEffect(() => {
    if (!token || !bayParam) {
      setIsValid(false);
      return;
    }

    // Check store first
    const storeValid = token === pairingToken && isTokenValid() && bayParam === bayId;
    
    if (storeValid) {
      setIsValid(true);
      return;
    }

    // If store doesn't have it, check localStorage directly (for cross-tab scenarios)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('rapsodo-bay-pairing');
        if (stored) {
          const parsed = JSON.parse(stored);
          const storedValid = 
            parsed.pairingToken === token &&
            parsed.bayId === bayParam &&
            parsed.tokenExpiresAt &&
            Date.now() < parsed.tokenExpiresAt;
          
          if (storedValid) {
            // Token is valid in storage, reload store
            initBay();
            setIsValid(true);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check localStorage:', error);
      }
    }
    
    setIsValid(false);
  }, [token, bayParam, pairingToken, bayId, isTokenValid, initBay]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pinCode.length !== 6) {
      showToast('Please enter a 6-digit code', 'error');
      return;
    }

    if (pinCode !== pairingCode) {
      showToast('Invalid code. Please try again.', 'error');
      setPinCode('');
      return;
    }

    // PIN matches and token is valid
    if (isValid) {
      handlePair();
    } else {
      showToast('Code expired. Please rescan.', 'error');
      setPinCode('');
    }
  };

  const handlePair = () => {
    if (!isAuthed || !userId || !email) {
      // Redirect to auth, then return here
      const returnUrl = `/pair?token=${token}&bay=${bayParam}`;
      router.push(`/auth?origin=PAIRING&returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsPairing(true);

    // Get display name from email
    const displayName = email.split('@')[0];
    const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    const emailMasked = `${email.split('@')[0].substring(0, 3)}***@${email.split('@')[1]}`;

    // Pair the account
    pairAccount({
      id: `linked-${userId}`,
      displayName: capitalizedName,
      emailMasked,
      userId,
      email,
    });

    setIsPairing(false);
    setIsPaired(true);
    showToast('Account linked successfully', 'success');
  };

  if (isPaired) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
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
                  Linked
                </h2>
                <p className="text-gray-600">
                  Your account has been linked to {bayId || 'this bay'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  if (!isValid) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Code Expired
                </h2>
                <p className="text-gray-600 mb-8">
                  This pairing code has expired. Please rescan the QR code or enter a new code from the bay screen.
                </p>
                <button
                  onClick={() => router.push('/play')}
                  className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Return to Bay
                </button>
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  if (!isAuthed || !userId || !email) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Sign In Required
                </h2>
                <p className="text-gray-600 mb-8">
                  Sign in to link your account to {bayId || 'this bay'}.
                </p>
                <button
                  onClick={() => {
                    const returnUrl = `/pair?token=${token}&bay=${bayParam}`;
                    router.push(`/auth?origin=PAIRING&returnUrl=${encodeURIComponent(returnUrl)}`);
                  }}
                  className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Sign In
                </button>
                {!showPinEntry && (
                  <button
                    onClick={() => setShowPinEntry(true)}
                    className="mt-4 w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm"
                  >
                    Enter code instead
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  // Authenticated and token valid - show pairing confirmation
  if (!showPinEntry) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Link Account
                </h2>
                <p className="text-gray-600 mb-8">
                  Link {email.split('@')[0]}'s account to {bayId || 'this bay'}?
                </p>
                <div className="space-y-4">
                  <button
                    onClick={handlePair}
                    disabled={isPairing}
                    className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {isPairing ? 'Linking...' : 'Link Account'}
                  </button>
                  <button
                    onClick={() => setShowPinEntry(true)}
                    className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm"
                  >
                    Enter code instead
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  // PIN entry mode
  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel">
        <TopNav />
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center uppercase tracking-wide">
                Enter Code
              </h2>
              <p className="text-gray-600 mb-6 text-center text-sm">
                Enter the 6-digit code from the bay screen.
              </p>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setPinCode(value);
                    }}
                    className="w-full px-4 py-3 text-center text-3xl font-bold font-mono border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={pinCode.length !== 6}
                  className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Link Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowPinEntry(false)}
                  className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm"
                >
                  Back
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}

export default function PairPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red"></div></div>}>
      <PairPageContent />
    </Suspense>
  );
}
