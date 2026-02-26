'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useBayStore } from '@/store/bayStore';
import { useToast } from '@/contexts/ToastContext';

export default function BayPairingCard() {
  const { showToast } = useToast();
  const { bayId, pairingCode, pairingToken, refreshPairingToken, initBay, isTokenValid } = useBayStore();
  const [pairingUrl, setPairingUrl] = useState<string>('');

  // Initialize bay and refresh token on mount
  useEffect(() => {
    initBay();
    if (!isTokenValid()) {
      refreshPairingToken();
    }
  }, [initBay, refreshPairingToken, isTokenValid]);

  // Update pairing URL when token changes
  useEffect(() => {
    if (pairingToken && bayId) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/pair?token=${pairingToken}&bay=${bayId}`;
      setPairingUrl(url);
    }
  }, [pairingToken, bayId]);

  // Auto-refresh token when expired
  useEffect(() => {
    const checkExpiry = setInterval(() => {
      if (!isTokenValid() && bayId) {
        refreshPairingToken();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkExpiry);
  }, [isTokenValid, refreshPairingToken, bayId]);

  const handleCopyLink = async () => {
    if (!pairingUrl) {
      showToast('Pairing URL not ready', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(pairingUrl);
      showToast('Link copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('Failed to copy link', 'error');
    }
  };

  const handleRefresh = () => {
    refreshPairingToken();
    showToast('Code refreshed', 'success');
  };

  if (!pairingCode || !pairingToken) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">Initializing pairing...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
        Link account to this bay
      </h4>

      {/* QR Code */}
      <div className="flex justify-center mb-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4">
          <QRCodeSVG value={pairingUrl} size={200} />
        </div>
      </div>

      {/* PIN Code */}
      <div className="text-center mb-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Code</p>
        <div className="text-4xl font-bold text-gray-900 tracking-wider font-mono">
          {pairingCode}
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-600 text-center mb-4">
        Scan QR in the mobile app or enter the code.
      </p>

      {/* Action buttons */}
      <div className="space-y-2">
        <button
          onClick={handleCopyLink}
          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Copy link
        </button>
        <button
          onClick={handleRefresh}
          className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh code
        </button>
      </div>
    </div>
  );
}
