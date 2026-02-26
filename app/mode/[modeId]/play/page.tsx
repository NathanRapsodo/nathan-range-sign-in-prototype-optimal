'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { getModeDisplayName, isValidModeId } from '@/lib/gameModes';
import { useGameModeStore } from '@/store/gameModeStore';
import { useToast } from '@/contexts/ToastContext';
import { useIdleManager } from '@/components/IdleManagerProvider';
import { getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';
import { getFullPath } from '@/lib/basePath';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';
import InGameSettingsModal from '@/components/InGameSettingsModal';
import Link from 'next/link';

export default function ModePlayPage() {
  const router = useRouter();
  const params = useParams();
  const modeId = params.modeId as string;
  const displayName = getModeDisplayName(modeId);
  const { showToast } = useToast();

  const { selectedModeId, players, addPlayForGuests } = useGameModeStore();
  const { markActivity } = useIdleManager();
  const [playStartedAt, setPlayStartedAt] = useState<number | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle unknown modeId
  if (!isValidModeId(modeId) || !displayName) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Unknown Mode
                </h2>
                <p className="text-gray-600 mb-8">
                  The game mode "{modeId}" is not recognized.
                </p>
                <Link
                  href="/play"
                  className="inline-block px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  const handleSimulateGamePlay = () => {
    if (isSimulated) return; // Prevent multiple clicks
    
    const timestamp = Date.now();
    setPlayStartedAt(timestamp);
    setIsSimulated(true);
    
    // Generate play record for guest players
    if (modeId) {
      addPlayForGuests(modeId, `Play in ${displayName}`);
    }
    
    // Mark shot activity for idle manager
    markActivity('shot');
    
    showToast('Game play simulated', 'success');
  };

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col relative">
        {/* Background Image with Overlay */}
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${getFullPath('/in_game.png')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <TopNav />

        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Header with Settings button and Players */}
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  markActivity(); // Settings interaction counts as activity
                }}
                className="flex items-center text-white hover:text-gray-200 font-medium drop-shadow-lg"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>

              {/* Players Tiles */}
              {players.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-white font-semibold text-lg drop-shadow-lg uppercase tracking-wide">
                    Players:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center gap-2"
                      >
                        {player.type === 'guest' && player.guestColor ? (
                          <div
                            style={getGuestColorStyle(player.guestColor)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                          >
                            {player.displayName.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-xs flex-shrink-0">
                            {player.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-white drop-shadow">
                          {player.displayName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden px-8 py-6">
            <div className="w-full max-w-3xl mx-auto h-full flex items-center">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 lg:p-12 w-full max-h-[90vh] overflow-y-auto">
                {/* Mode Header */}
                <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center uppercase tracking-wide">
                  {displayName}
                </h1>

                {/* Game Complete Stats */}
                {isSimulated && playStartedAt && (
                  <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border-2 border-gray-200">
                    <div className="text-center mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                        Game Complete
                      </h2>
                      <p className="text-sm text-gray-600">
                        Completed at {new Date(playStartedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Longest Drive */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Longest Drive</div>
                            <div className="text-2xl font-bold text-blue-900">287 yds</div>
                          </div>
                        </div>
                      </div>

                      {/* Total Shots */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Shots</div>
                            <div className="text-2xl font-bold text-green-900">42</div>
                          </div>
                        </div>
                      </div>

                      {/* Average Distance */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Avg Distance</div>
                            <div className="text-2xl font-bold text-purple-900">245 yds</div>
                          </div>
                        </div>
                      </div>

                      {/* Accuracy */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Accuracy</div>
                            <div className="text-2xl font-bold text-orange-900">78%</div>
                          </div>
                        </div>
                      </div>

                      {/* Best Shot */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 border-2 border-teal-200 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Best Shot</div>
                            <div className="text-2xl font-bold text-teal-900">312 yds</div>
                          </div>
                        </div>
                      </div>

                      {/* Play Time */}
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border-2 border-pink-200 shadow-md">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-pink-700 uppercase tracking-wide">Play Time</div>
                            <div className="text-2xl font-bold text-pink-900">18:32</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-4">
                  {!isSimulated ? (
                    <button
                      onClick={handleSimulateGamePlay}
                      className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                      Simulate game play
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push('/play')}
                      className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                      Back to home
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <InGameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </RangeLayout>
  );
}
