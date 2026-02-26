'use client';

import { QRCodeSVG } from 'qrcode.react';
import { APP_DOWNLOAD_URL } from '@/lib/constants';

export default function AppDownloadPromoPanel() {
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 uppercase tracking-wide">
          Get the app
        </h3>
        <p className="text-base text-gray-700 font-medium">
          Link faster. Save plays. Own your progress.
        </p>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Scan once to link to any bay
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            All your plays & results in one place
          </p>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Start games quicker with saved profiles
          </p>
        </div>
      </div>

      {/* QR Code */}
      <div className="mb-4 pt-4 border-t border-blue-200">
        <div className="text-center">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Scan to download the app
          </p>
          <div className="flex justify-center mb-1.5">
            <div className="bg-white rounded-lg shadow-md border border-blue-200 p-2">
              <QRCodeSVG value={APP_DOWNLOAD_URL} size={140} />
            </div>
          </div>
          <p className="text-xs text-gray-600">
            Already installed? Open the app and you're ready.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-600 text-center">
          Works with all Rapsodo Golf experiences
        </p>
      </div>
    </div>
  );
}
