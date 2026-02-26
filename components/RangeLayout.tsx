'use client';

interface RangeLayoutProps {
  children: React.ReactNode;
  showBezel?: boolean;
}

export default function RangeLayout({ children, showBezel = true }: RangeLayoutProps) {
  return (
    <div className="w-screen h-screen bg-range-bg flex items-center justify-center overflow-hidden">
      {showBezel ? (
        <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video relative">
          {/* Bezel effect - outer frame */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 rounded-lg shadow-2xl border-4 border-black/50" />
          {/* Inner bezel highlight */}
          <div className="absolute inset-[1%] border border-white/10 rounded-md pointer-events-none" />
          {/* Screen area */}
          <div className="absolute inset-[3%] bg-range-panel rounded-sm overflow-hidden shadow-inner">
            {children}
          </div>
        </div>
      ) : (
        <div className="w-full h-full">{children}</div>
      )}
    </div>
  );
}
