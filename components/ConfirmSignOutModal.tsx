'use client';

import { useEffect, useRef } from 'react';

interface ConfirmSignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountName: string;
  onConfirm: () => void;
}

export default function ConfirmSignOutModal({
  isOpen,
  onClose,
  accountName,
  onConfirm,
}: ConfirmSignOutModalProps) {
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
          className="bg-white rounded-lg shadow-2xl w-full max-w-[400px] max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Header */}
            <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Sign out {accountName}?
            </h2>

            {/* Content */}
            <div className="space-y-3 mb-6">
              <p className="text-base text-gray-700">
                This will unlink the account from this bay.
              </p>
              <p className="text-base text-gray-700">
                Your game data will be saved to your account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold uppercase tracking-wide rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-rapsodo-red text-white font-semibold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
