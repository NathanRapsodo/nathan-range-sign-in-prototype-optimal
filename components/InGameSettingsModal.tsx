'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface InGameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InGameSettingsModal({
  isOpen,
  onClose,
}: InGameSettingsModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

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

  const handleLeaveGame = () => {
    router.push('/play');
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
          className="bg-white rounded-lg shadow-2xl w-full max-w-[520px] max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                Settings
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

            {/* Settings List */}
            <div className="space-y-6 mb-8">
              {/* Units */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Units</div>
                  <div className="text-sm text-gray-500">Distance measurement</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-rapsodo-red text-white font-medium rounded-lg text-sm">
                    Yards
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-300">
                    Meters
                  </button>
                </div>
              </div>

              {/* Camera overlay */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Camera overlay</div>
                  <div className="text-sm text-gray-500">Show camera feed overlay</div>
                </div>
                <div className="flex items-center">
                  <button className="px-4 py-2 bg-rapsodo-red text-white font-medium rounded-lg text-sm">
                    On
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-300 ml-2">
                    Off
                  </button>
                </div>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Sound</div>
                  <div className="text-sm text-gray-500">Audio feedback</div>
                </div>
                <div className="flex items-center">
                  <button className="px-4 py-2 bg-rapsodo-red text-white font-medium rounded-lg text-sm">
                    On
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-300 ml-2">
                    Off
                  </button>
                </div>
              </div>

              {/* Left-handed mode */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Left-handed mode</div>
                  <div className="text-sm text-gray-500">Mirror interface for left-handed players</div>
                </div>
                <div className="flex items-center">
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-300">
                    On
                  </button>
                  <button className="px-4 py-2 bg-rapsodo-red text-white font-medium rounded-lg text-sm ml-2">
                    Off
                  </button>
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">Difficulty</div>
                  <div className="text-sm text-gray-500">Game difficulty level</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-rapsodo-red text-white font-medium rounded-lg text-sm">
                    Casual
                  </button>
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-300">
                    Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLeaveGame}
                className="w-full px-6 py-3 bg-red-600 text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave game
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
