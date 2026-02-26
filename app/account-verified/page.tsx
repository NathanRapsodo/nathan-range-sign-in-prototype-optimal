'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';

function AccountVerifiedPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const origin = searchParams.get('origin') || 'START';
  const endedSessionId = searchParams.get('endedSessionId');
  const inSession = searchParams.get('inSession') === '1';
  const phoneAuth = searchParams.get('phoneAuth') === 'true';
  const { isAuthed } = useAuthStore();

  // Check if this is a phone auth window
  const hasOpener = typeof window !== 'undefined' && window.opener && !window.opener.closed;

  const handleLetsPlay = () => {
    // If phone auth window, just show message (main window already handled)
    if (hasOpener || phoneAuth) {
      return; // Main window already navigated
    }
    // Navigate to play page
    router.push('/play');
  };

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
              <h2 className="text-3xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Account verified ✅
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {searchParams.get('autoSignedIn') === 'true'
                  ? (searchParams.get('origin') === 'POST_SESSION_SAVE'
                    ? 'Saving your session now… Return to the range screen.'
                    : 'You\'re signed in. Return to the range screen.')
                  : isAuthed || hasOpener || phoneAuth
                  ? 'You\'re all set! You can close this window.'
                  : 'You\'re all set! Let\'s get started.'}
              </p>
              {(hasOpener || phoneAuth) ? (
                <p className="text-sm text-gray-500">
                  {searchParams.get('autoSignedIn') === 'true'
                    ? 'The device has been signed in automatically.'
                    : 'The device has been signed in. You can close this window.'}
                </p>
              ) : (
                <button
                  onClick={handleLetsPlay}
                  className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Let's Play
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}

export default function AccountVerifiedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red"></div></div>}>
      <AccountVerifiedPageContent />
    </Suspense>
  );
}
