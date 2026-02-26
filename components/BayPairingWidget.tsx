'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useBayStore } from '@/store/bayStore';
import { getFullPath } from '@/lib/basePath';

interface BayPairingWidgetProps {
  forceExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function BayPairingWidget({ forceExpanded, onExpandedChange }: BayPairingWidgetProps = {} as BayPairingWidgetProps) {
  const { bayId, pairingCode, pairingToken, refreshPairingToken, initBay, isTokenValid } = useBayStore();
  const [pairingUrl, setPairingUrl] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Track previous forceExpanded to detect changes
  const prevForceExpandedRef = useRef(forceExpanded);
  
  // Sync with external control - only expand if forceExpanded is true
  // If user manually closes, onExpandedChange will update parent state
  useEffect(() => {
    // Only update if forceExpanded actually changed
    if (forceExpanded !== prevForceExpandedRef.current) {
      prevForceExpandedRef.current = forceExpanded;
      
      if (forceExpanded === true && !isExpanded) {
        // Only expand if not already expanded (prevents flicker)
        setIsExpanded(true);
      } else if (forceExpanded === false && isExpanded) {
        // Only auto-close if explicitly set to false (not just undefined)
        setIsExpanded(false);
      }
    }
  }, [forceExpanded, isExpanded]);

  // Track previous isExpanded to prevent unnecessary callbacks
  const prevIsExpandedRef = useRef(isExpanded);
  
  // Notify parent of expansion changes (only when actually changed)
  useEffect(() => {
    if (isExpanded !== prevIsExpandedRef.current) {
      prevIsExpandedRef.current = isExpanded;
      if (onExpandedChange) {
        onExpandedChange(isExpanded);
      }
    }
  }, [isExpanded, onExpandedChange]);

  // Initialize bay and ensure token is valid
  useEffect(() => {
    initBay();
    if (!isTokenValid()) {
      refreshPairingToken();
    }
  }, [initBay, isTokenValid, refreshPairingToken]);

  // Update pairing URL when token changes
  useEffect(() => {
    if (pairingToken && bayId) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/pair?token=${pairingToken}&bay=${bayId}`;
      setPairingUrl(url);
    }
  }, [pairingToken, bayId]);

  // Auto-refresh token every 90 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPairingToken();
    }, 90 * 1000); // 90 seconds

    return () => clearInterval(interval);
  }, [refreshPairingToken]);

  // Note: Outside click handling is now done via the backdrop div

  if (!pairingCode || !pairingToken || !pairingUrl) {
    return null; // Don't show until ready
  }

  return (
    <div
      ref={widgetRef}
      className={`fixed top-[100px] right-14 ${isExpanded ? 'z-[65]' : 'z-10'}`}
    >
      {!isExpanded ? (
        // Collapsed state
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="relative p-2.5 pb-1 hover:opacity-80 transition-all active:scale-95 flex flex-col items-center"
              aria-label="Scan to quickly link your account"
            >
              {/* Pulsing border animation */}
              <div className="absolute inset-0 rounded-lg animate-pulse-border" />
              
              {/* Small QR */}
              <div className="relative z-10">
                <QRCodeSVG value={pairingUrl} size={75} />
              </div>
              {/* Microcopy hint - directly under QR code, inside pulsing border */}
              <p className="text-[10px] text-gray-500 mt-0.5 text-center w-[75px] relative z-10">
                Tap to expand
              </p>
            </button>
          </div>
          {/* PIN and text */}
          <div className="flex flex-col gap-1">
            <div className="text-base font-bold text-gray-900 tracking-wider font-mono">
              {pairingCode}
            </div>
            <div className="text-xs font-medium text-gray-700 leading-tight max-w-[120px]">
              Scan to quickly link your account
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Transparent backdrop for outside clicks */}
          <div
            className="fixed inset-0 z-[64]"
            onClick={() => setIsExpanded(false)}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{ pointerEvents: 'auto' }}
          />

          {/* Expanded state */}
          <div className="relative z-[65] bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-[280px]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Link account
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-4 h-4"
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

            {/* Larger QR */}
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-md shadow-sm border border-gray-100 p-3">
                <QRCodeSVG value={pairingUrl} size={200} />
              </div>
            </div>

            {/* PIN */}
            <div className="text-center mb-3">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Code</p>
              <div className="text-3xl font-bold text-gray-900 tracking-wider font-mono">
                {pairingCode}
              </div>
            </div>

            {/* Instruction text */}
            <p className="text-xs text-gray-600 text-center mb-4">
              Scan with camera or enter code in the app.
            </p>

            {/* Demo section */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 text-center">
                Demo
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const url = getFullPath(`/sim/app?bay=${bayId}&token=${pairingToken}`);
                    window.open(url, 'phone-app', 'width=420,height=840');
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors"
                >
                  Simulate scan (App installed)
                </button>
                <button
                  onClick={() => {
                    const url = getFullPath(`/sim/web?bay=${bayId}&token=${pairingToken}`);
                    window.open(url, 'phone-web', 'width=420,height=840');
                  }}
                  className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors"
                >
                  Simulate scan (No app installed)
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
