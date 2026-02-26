'use client';

import { useInactivityManager } from '@/hooks/useInactivityManager';
import IdleWarningModal from '@/components/IdleWarningModal';
import DemoIdleButton from '@/components/DemoIdleButton';

export default function InactivityManager() {
  useInactivityManager();
  return (
    <>
      <IdleWarningModal />
      <DemoIdleButton />
    </>
  );
}
