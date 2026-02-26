'use client';

import { useIdleManager } from '@/components/IdleManagerProvider';

// Demo mode flag - set to false in production
const DEMO_MODE = process.env.NODE_ENV !== 'production';

export default function IdleDemoButton() {
  const { triggerIdlePrompt } = useIdleManager();

  if (!DEMO_MODE) {
    return null;
  }

  return (
    <button
      onClick={triggerIdlePrompt}
      className="fixed bottom-6 right-6 z-[9998] w-12 h-12 rounded-full bg-gray-800/70 hover:bg-gray-800/90 text-white text-xs font-semibold uppercase tracking-wide flex items-center justify-center shadow-lg hover:shadow-xl transition-all backdrop-blur-sm border border-white/20"
      title="Show idle modal (demo)"
      aria-label="Trigger idle modal for demo"
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </button>
  );
}
