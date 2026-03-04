'use client';

import { useState } from 'react';
import SignOutAllModal from '@/components/SignOutAllModal';

export default function EndSessionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-5 py-2.5 bg-rapsodo-red text-white rounded-full font-semibold uppercase tracking-wide text-sm hover:bg-red-700 active:bg-red-800 active:scale-[0.98] transition-all duration-150 shadow-lg hover:shadow-xl flex items-center gap-2"
        aria-label="End session"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        End session
      </button>
      <SignOutAllModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
