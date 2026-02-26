'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameModeStore } from '@/store/gameModeStore';
import { useGuestProfilesStore } from '@/store/guestProfilesStore';
import { useToast } from '@/contexts/ToastContext';
import { guestColors, getGuestColorClass, getGuestColorStyle, type GuestColorToken } from '@/lib/guestColors';
import { APP_DOWNLOAD_URL } from '@/lib/constants';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGuestCreated?: (profile: { id: string; name: string; colorToken: GuestColorToken }) => void; // Callback when guest is created
}

export default function AddGuestModal({
  isOpen,
  onClose,
  onGuestCreated,
}: AddGuestModalProps) {
  const { showToast } = useToast();
  const { addGuest } = useGameModeStore();
  const { addGuestProfile } = useGuestProfilesStore();
  const modalRef = useRef<HTMLDivElement>(null);

  const [guestName, setGuestName] = useState('');
  const [selectedColor, setSelectedColor] = useState<GuestColorToken | null>(null);

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
      setGuestName('');
      setSelectedColor(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      showToast('Please enter a guest name', 'error');
      return;
    }

    if (!selectedColor) {
      showToast('Please select a color', 'error');
      return;
    }

    // Add to guest profiles store (global pool)
    const profile = addGuestProfile(guestName.trim(), selectedColor);
    
    // Also add to gameModeStore if needed (for backward compatibility)
    // But the main source of truth is guestProfilesStore
    addGuest(guestName.trim(), selectedColor);
    
    showToast('Guest added', 'success');
    
    // Call callback if provided (e.g., from setup page to auto-fill slot)
    if (onGuestCreated) {
      console.log('[AddGuestModal] Calling onGuestCreated with profile:', profile);
      onGuestCreated({
        id: profile.id,
        name: profile.name,
        colorToken: profile.colorToken,
      });
    }
    
    onClose();
  };

  const canSubmit = guestName.trim().length > 0 && selectedColor !== null;

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
          className="bg-white rounded-lg shadow-2xl w-full max-w-[900px] min-w-[720px] max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Promo Panel */}
              <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="mb-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Save your game data
                  </h3>
                  <p className="text-sm text-gray-700 font-medium">
                    Guests don't keep plays & results unless you create an account.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Keep plays & results
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Track progress over time
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Use your profile on any bay
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mb-4 pt-4 border-t border-blue-200">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Scan to get the app
                    </p>
                    <div className="flex justify-center mb-2">
                      <div className="bg-white rounded-lg shadow-md border border-blue-200 p-2">
                        <QRCodeSVG value={APP_DOWNLOAD_URL} size={140} />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Already have the app? Link your account on the bay screen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Guest Form */}
              <div className="flex flex-col relative">
                {/* Header with title and close button */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                    Add guest
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

                <form onSubmit={handleSubmit} className="space-y-6 flex-1">
                  {/* Guest name */}
                  <div>
                    <label
                      htmlFor="guestName"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Guest name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="guestName"
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                      placeholder="Enter guest name"
                    />
                  </div>

                  {/* Color picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Color <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-4 w-full px-4">
                      {guestColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          style={getGuestColorStyle(color)}
                          className={`w-16 h-16 rounded-full transition-all mx-auto ${
                            selectedColor === color
                              ? 'ring-4 ring-offset-2 ring-rapsodo-red scale-110'
                              : 'hover:scale-105 hover:ring-2 hover:ring-offset-1 hover:ring-gray-300'
                          }`}
                          aria-label={`Select ${color} color`}
                        >
                          {selectedColor === color && (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="mt-auto pt-4">
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full px-6 py-3 bg-rapsodo-red text-white font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Guest
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
