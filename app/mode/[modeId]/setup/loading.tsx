export default function ModeSetupLoading() {
  // Next.js loading.tsx - shows while the page is loading
  return (
    <div className="fixed inset-0 z-50">
      {/* Background Image with Overlay - same as setup page */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/game_lobby.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Loading Content */}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-white drop-shadow-lg">
            Loading game mode...
          </p>
        </div>
      </div>
    </div>
  );
}
