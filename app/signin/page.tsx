'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') || 'START';

  // Redirect to unified auth panel
  useEffect(() => {
    router.replace(`/auth?mode=signin&origin=${origin}`);
  }, [router, origin]);

  return null; // Redirecting...
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageContent />
    </Suspense>
  );
}
