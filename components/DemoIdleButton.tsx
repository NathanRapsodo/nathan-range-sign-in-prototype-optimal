'use client';

import { usePathname } from 'next/navigation';
import { isPlayRoute } from '@/lib/routeHelpers';
import { useMemo, useCallback, useState, useEffect } from 'react';

export default function DemoIdleButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  
  const isOnPlayPage = useMemo(() => isPlayRoute(pathname), [pathname]);

  // Debounce visibility to prevent flickering during navigation
  useEffect(() => {
    if (isOnPlayPage) {
      // Small delay to prevent flicker during route transitions
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOnPlayPage]);

  const handleClick = useCallback(() => {
    const inactivityManager = (window as any).inactivityManager;
    if (inactivityManager && inactivityManager.demoOpenIdleModal) {
      inactivityManager.demoOpenIdleModal();
    }
  }, []);

  // Hide button if not on Play page or not yet visible
  if (!isOnPlayPage || !isVisible) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-[9998] px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded shadow-lg hover:bg-yellow-600 transition-colors"
      title="Demo: Open idle warning modal with countdown"
    >
      Demo: Idle modal
    </button>
  );
}
