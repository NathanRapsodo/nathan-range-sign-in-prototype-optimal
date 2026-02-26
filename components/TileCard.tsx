'use client';

import Link from 'next/link';

interface TileCardProps {
  title: string;
  description: string;
  gradient: string;
  modeId?: string;
}

export default function TileCard({ title, description, gradient, modeId }: TileCardProps) {
  const content = (
    <>
      {/* Image area with gradient */}
      <div className={`h-48 ${gradient} relative overflow-hidden`}>
        {/* Subtle landscape elements */}
        <div className="absolute inset-0 opacity-30">
          <svg viewBox="0 0 400 300" className="w-full h-full" preserveAspectRatio="none">
            {/* Sky gradient */}
            <defs>
              <linearGradient id={`sky-${title.replace(/\s+/g, '-')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffd89b" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#19547b" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <rect width="400" height="300" fill={`url(#sky-${title.replace(/\s+/g, '-')})`} />
            {/* Hills/mountains */}
            <path
              d="M0,200 Q100,150 200,180 T400,200 L400,300 L0,300 Z"
              fill="#2d5016"
              opacity="0.4"
            />
            {/* Golf green circle */}
            <circle cx="200" cy="180" r="40" fill="#2d7a32" opacity="0.5" />
            {/* Flagstick */}
            <line x1="200" y1="140" x2="200" y2="180" stroke="#fff" strokeWidth="2" opacity="0.6" />
            <polygon points="200,140 210,150 200,150" fill="#dc2626" opacity="0.7" />
            {/* Ball trajectory arc */}
            <path
              d="M50,250 Q125,150 200,180"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
      {/* Content area */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed flex-1">
          {description}
        </p>
      </div>
    </>
  );

  if (modeId) {
    return (
      <Link
        href={`/mode/${modeId}/setup`}
        className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-xl transition-shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col cursor-default">
      {content}
    </div>
  );
}
