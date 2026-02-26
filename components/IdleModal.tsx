'use client';

interface IdleModalProps {
  isOpen: boolean;
  showCountdown: boolean;
  countdownText: string;
  onStillHere: () => void;
}

export default function IdleModal({
  isOpen,
  showCountdown,
  countdownText,
  onStillHere,
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
            <div className="mb-6">
              <p className="text-gray-700 mb-3 text-center">
                For your privacy, we'll automatically sign out all accounts.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>All linked accounts will be signed out</li>
                  <li>Guest accounts will be removed and their data will be lost</li>
                  <li>You'll be returned to the home screen</li>
                </ul>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-rapsodo-red mb-2">
                  {countdownText}
                </div>
                <p className="text-sm text-gray-600">Signing out in</p>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-gray-700 mb-3 text-center">
                For your privacy, we'll automatically sign out all accounts after a period of inactivity.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>What will happen:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>All linked accounts will be signed out</li>
                  <li>Guest accounts will be removed and their data will be lost</li>
                  <li>You'll be returned to the home screen</li>
                </ul>
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onStillHere}
              className="w-full px-6 py-4 bg-rapsodo-red text-white font-bold text-lg uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              I'm still here
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
