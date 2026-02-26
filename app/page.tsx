'use client';

import { useRouter } from 'next/navigation';
import RangeLayout from '@/components/RangeLayout';

export default function SplashPage() {
  const router = useRouter();

  const handleClick = () => {
    // Always route to start screen - never auto-route to play
    router.push('/start');
  };

  return (
    <RangeLayout showBezel={false}>
      <div
        className="w-full h-full relative cursor-pointer"
        onClick={handleClick}
      >
        {/* Background with golf course aesthetic */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-500 to-green-700">
          {/* Add texture/noise effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Golf course elements */}
          <div className="absolute inset-0">
            {/* Putting green circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-green-400/40 blur-2xl" />
            {/* Sand bunker areas */}
            <div className="absolute top-1/4 right-1/4 w-64 h-48 rounded-full bg-amber-200/30 blur-xl" />
            <div className="absolute bottom-1/3 right-1/3 w-80 h-56 rounded-full bg-amber-200/25 blur-2xl" />
            {/* Tree shadows */}
            <div className="absolute top-1/3 left-1/4 w-32 h-32 rounded-full bg-black/20 blur-2xl" />
            <div className="absolute bottom-1/4 left-1/3 w-40 h-40 rounded-full bg-black/15 blur-2xl" />
          </div>
        </div>

        {/* Logo in top left */}
        <div className="absolute top-8 left-8 text-white/80">
          <div className="text-lg font-bold tracking-wide">
            <span className="relative inline-block">
              <span className="text-xl">R</span>
              {/* Golf club icon integrated into R */}
              <svg
                className="absolute -top-0.5 -right-1 w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2L8 4h2v2l-2-2v2l2 2V8h2l-2-4zm0 8l-2 2h2v-2zm0 4l-2 2h2v-2z" />
              </svg>
            </span>
            <span>apsodo GOLF</span>
          </div>
        </div>

        {/* Centered text block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-center space-y-6">
            <div className="text-3xl font-semibold tracking-wider uppercase">
              WELCOME TO
            </div>
            <div className="text-8xl font-bold tracking-tight italic leading-none">
              RAPSODO<span className="not-italic">GOLF</span>
            </div>
            <div className="text-2xl font-light mt-12 tracking-wide">
              Touch Screen to Start
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}
