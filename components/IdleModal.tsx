'use client';

interface IdleModalProps {
  isOpen: boolean;
  showCountdown: boolean;
  countdownText: string;
  onStillHere: () => void;
  onSignOut: () => void;
}

export default function IdleModal({
  isOpen,
  showCountdown,
  countdownText,
  onStillHere,
  onSignOut,
}: IdleModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide text-center">
            Still using this bay?
          </h2>
          
          {/* Body text */}
          {showCountdown ? (
            <div className="mb-6 text-center">
              <p className="text-gray-600 mb-4">
                We'll sign out soon to protect your data.
              </p>
              <div className="text-3xl font-bold text-rapsodo-red mb-2">
                {countdownText}
              </div>
              <p className="text-sm text-gray-600">Signing out in</p>
            </div>
          ) : (
            <p className="text-gray-600 mb-6 text-center">
              We'll sign out soon to protect your data.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onStillHere}
              className="w-full px-6 py-4 bg-rapsodo-red text-white font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              I'm still here
            </button>
            <button
              onClick={onSignOut}
              className="w-full px-6 py-4 bg-gray-200 text-gray-800 font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
