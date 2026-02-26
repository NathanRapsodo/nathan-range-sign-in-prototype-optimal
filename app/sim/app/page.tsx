'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNextMockAccount } from '@/lib/mockAccountPicker';
import { formatDisplayName } from '@/lib/nameFormatting';

type Screen = 'loading' | 'signing-in' | 'linking' | 'success';

function AppSimPageContent() {
  const searchParams = useSearchParams();
  const bayId = searchParams.get('bay') || 'bay-001';
  const token = searchParams.get('token') || '';
  
  const [screen, setScreen] = useState<Screen>('loading');
  const [account, setAccount] = useState<ReturnType<typeof getNextMockAccount> | null>(null);

  useEffect(() => {
    // Get mock account
    const mockAccount = getNextMockAccount();
    setAccount(mockAccount);

    // Screen 1: Opening app
    const timer1 = setTimeout(() => {
      setScreen('signing-in');
    }, 800);

    // Screen 2: Signing in
    const timer2 = setTimeout(() => {
      setScreen('linking');
    }, 1600);

    // Screen 3: Linking
    const timer3 = setTimeout(() => {
      setScreen('success');
      // Broadcast success immediately
      broadcastPairSuccess(bayId, mockAccount);
    }, 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [bayId]);

  const broadcastPairSuccess = (bay: string, acc: { id: string; name: string; email: string }) => {
    if (typeof window === 'undefined') return;
    
    try {
      const channel = new BroadcastChannel('bay-pairing');
      channel.postMessage({
        type: 'PAIR_SUCCESS',
        bayId: bay,
        account: {
          id: acc.id,
          name: acc.name,
          email: acc.email,
        },
      });
      channel.close();
    } catch (error) {
      console.error('Failed to broadcast pair success:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-full max-w-[390px] bg-black rounded-[2.5rem] p-2 shadow-2xl">
        {/* Status bar */}
        <div className="bg-black rounded-t-[2rem] px-6 py-2 flex items-center justify-between text-white text-xs">
          <div>9:41</div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-4 h-2 bg-white rounded-sm m-0.5" />
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div className="bg-white rounded-b-[2rem] min-h-[800px] flex flex-col">
          {screen === 'loading' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Opening Rapsodo Golf…</p>
            </div>
          )}

          {screen === 'signing-in' && account && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Signing in as {account.name}</p>
            </div>
          )}

          {screen === 'linking' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Linking to Bay {bayId}</p>
            </div>
          )}

          {screen === 'success' && account && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Linked!</h1>
              <p className="text-gray-600">
                Your account is now connected to this bay.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppSimPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red"></div></div>}>
      <AppSimPageContent />
    </Suspense>
  );
}
