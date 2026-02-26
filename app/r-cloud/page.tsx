'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';
import type { Session } from '@/lib/types';

export default function RCloudPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          setSession(data.session);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (isLoading) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        </div>
      </RangeLayout>
    );
  }

  if (!session || session.syncStatus !== 'synced') {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-2xl">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  No synced session
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {!session
                    ? 'This session has not been synced yet.'
                    : 'This session is not yet synced to R-Cloud.'}
                </p>
                {sessionId && (
                  <button
                    onClick={() => router.push(`/end`)}
                    className="px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                  >
                    GO TO SESSION SUMMARY
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  const avgCarry =
    session.shots.length > 0
      ? Math.round(
          session.shots.reduce((sum, shot) => sum + shot.carryYards, 0) /
            session.shots.length
        )
      : 0;
  const avgBallSpeed =
    session.shots.length > 0
      ? Math.round(
          session.shots.reduce((sum, shot) => sum + shot.ballSpeedMph, 0) /
            session.shots.length
        )
      : 0;

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel overflow-hidden">
        <TopNav />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-bold text-gray-900 uppercase tracking-wide">
                R-CLOUD
              </h2>
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase tracking-wide">
                Synced
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-sm text-gray-600 mb-1 uppercase tracking-wide font-bold">
                  Total Shots
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {session.shots.length}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-sm text-gray-600 mb-1 uppercase tracking-wide font-bold">
                  Avg Carry
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {avgCarry} yds
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <div className="text-sm text-gray-600 mb-1 uppercase tracking-wide font-bold">
                  Avg Ball Speed
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {avgBallSpeed} mph
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                Shot List
              </h3>
              {session.shots.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No shots recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wide">
                          #
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Carry (yds)
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Ball Speed (mph)
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Launch Angle (°)
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 uppercase tracking-wide">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.shots.map((shot, index) => (
                        <tr
                          key={shot.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {shot.carryYards}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {shot.ballSpeedMph}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {shot.launchDeg}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(shot.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}
