'use client';

import { useEffect, useRef } from 'react';

interface AddAccountChoicePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  onSelectSignIn: () => void;
  onSelectAddGuest: () => void;
  onCloseParent?: () => void; // Callback to close parent popover
}

export default function AddAccountChoicePopover({
  isOpen,
  onClose,
  anchorRef,
  onSelectSignIn,
  onSelectAddGuest,
  onCloseParent,
}: AddAccountChoicePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

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
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose();
        // Also close parent popover if provided
        if (onCloseParent) {
          onCloseParent();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, anchorRef, onCloseParent]);

  // Position popover relative to anchor
  useEffect(() => {
    if (isOpen && anchorRef?.current && popoverRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popover = popoverRef.current;
      
      // Position below the anchor button
      const top = anchorRect.bottom + 8;
      const left = anchorRect.left;
      
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      popover.style.right = 'auto';
    }
  }, [isOpen, anchorRef]);

  if (!isOpen) return null;

  return (
    <>
      {/* Transparent backdrop for outside clicks */}
      <div
        className="fixed inset-0 z-[55]"
        onClick={() => {
          onClose();
          // Also close parent popover if provided
          if (onCloseParent) {
            onCloseParent();
          }
        }}
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        className="fixed z-[60] w-[280px] bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden"
        style={{
          top: 'auto',
          left: 'auto',
        }}
      >
        <div className="p-2 space-y-1">
          <button
            onClick={() => {
              onSelectSignIn();
              onClose();
            }}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-rapsodo-red transition-colors text-left"
          >
            <div className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Sign in
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Use your Rapsodo Golf account
            </div>
          </button>

          <button
            onClick={() => {
              onSelectAddGuest();
              onClose();
            }}
            className="w-full p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-rapsodo-red transition-colors text-left"
          >
            <div className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Add guest
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              Quick play without saving history
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
