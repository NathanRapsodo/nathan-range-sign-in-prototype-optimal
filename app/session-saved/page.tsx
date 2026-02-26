'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';
import type { Session } from '@/lib/types';

export default function SessionSavedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const logoutAfterDone = searchParams.get('logoutAfterDone') === '1';
  
  const { shots: storeShots, clearSession } = useSessionStore();
  const { clearAuth } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [shots, setShots] = useState(storeShots);
  const [isProcessingDone, setIsProcessingDone] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    // Fetch session data to display stats
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
          // Use shots from fetched session if available, otherwise use store
          if (data.session.shots && data.session.shots.length > 0) {
            setShots(data.session.shots);
          }
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };

    fetchSession();
  }, [sessionId, router]);

  const handleDone = () => {
    // Prevent double-click
    if (isProcessingDone) return;
    setIsProcessingDone(true);

    // Clear auth state (logout) if logoutAfterDone flag is set
    if (logoutAfterDone) {
      clearAuth();
    }
    
    // Clear session state
    clearSession();
    
    // Clear session recovery metadata for this ended session
    if (typeof window !== 'undefined' && sessionId) {
      try {
        const stored = localStorage.getItem('rapsodo-session-recovery');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.sessionId === sessionId) {
            localStorage.removeItem('rapsodo-session-recovery');
          }
        }
      } catch (error) {
        console.error('Failed to clear recovery metadata:', error);
      }
    }
    
    // Use replace to avoid back stack issues
    router.replace('/');
  };

  if (!sessionId || !session) {
    return null;
  }

  const avgCarry =
    shots.length > 0
      ? Math.round(
          shots.reduce((sum, shot) => sum + shot.carryYards, 0) / shots.length
        )
      : 0;
  const avgBallSpeed =
    shots.length > 0
      ? Math.round(
          shots.reduce((sum, shot) => sum + shot.ballSpeedMph, 0) /
            shots.length
        )
      : 0;

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel">
        <TopNav />

        <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto py-8">
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-lg shadow-xl p-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center uppercase tracking-wide">
                SESSION COMPLETE ✅
              </h1>

              {/* Session Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6 mt-8">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-sm text-gray-600 mb-1">Total Shots</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {shots.length}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-sm text-gray-600 mb-1">Avg Carry</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {avgCarry} yds
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-sm text-gray-600 mb-1">Avg Ball Speed</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {avgBallSpeed} mph
                  </div>
                </div>
              </div>

              <div className="text-center space-y-6">
                <p className="text-lg text-gray-700 mb-2">
                  Your session has been saved to your account.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Your stats are syncing now and will be available in R-Cloud shortly.
                </p>
                {logoutAfterDone && (
                  <p className="text-xs text-gray-500 mb-6">
                    You've been signed out on this device.
                  </p>
                )}
                <button
                  onClick={handleDone}
                  disabled={isProcessingDone}
                  className="w-full px-8 py-6 bg-rapsodo-red text-white font-bold text-2xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}
