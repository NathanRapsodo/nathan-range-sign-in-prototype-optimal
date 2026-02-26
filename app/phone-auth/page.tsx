'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useToastStore } from '@/store/toastStore';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';

export default function PhoneAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'signin';
  const claimToken = searchParams.get('claimToken');
  const origin = searchParams.get('origin') || 'START';

  const { setAuth } = useAuthStore();
  const { setSession } = useSessionStore();
  const { setPendingToast } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/signin';
      const body = mode === 'signup'
        ? { email, password, phoneNumber: phoneNumber || undefined }
        : { email, password };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      // If signup, store password temporarily for auto sign-in after verification
      if (mode === 'signup' && data.verificationRequired) {
        // Store password in sessionStorage for auto sign-in after verification (prototype only)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending_signup_password', password);
          sessionStorage.setItem('pending_signup_email', email);
        }
        const params = new URLSearchParams();
        params.set('email', email);
        if (origin) params.set('origin', origin);
        if (claimToken) params.set('claimToken', claimToken);
        router.push(`/verify-email?${params.toString()}`);
        return;
      }

      // Check if this window was opened by another window (phone auth simulation)
      const hasOpener = typeof window !== 'undefined' && window.opener && !window.opener.closed;

      if (hasOpener) {
        // Phone auth window - send message to opener and show success
        const authPayload = {
          type: 'PHONE_AUTH_SUCCESS',
          userId: data.userId,
          email: data.email,
          accessToken: data.accessToken || `mock_token_${Date.now()}`,
          refreshToken: data.refreshToken || `mock_refresh_${Date.now()}`,
          origin,
          claimToken,
          endedSessionId: searchParams.get('endedSessionId') || undefined,
        };

        console.log('[PhoneAuth] Sending message to opener:', authPayload);
        
        // Send message to opener window
        try {
          window.opener.postMessage(authPayload, window.location.origin);
          console.log('[PhoneAuth] Message sent successfully');
        } catch (error) {
          console.error('[PhoneAuth] Failed to send message:', error);
        }

        // Set auth state in this window too (for display)
        setAuth(data.userId, data.email);

        // If we have a claim token, claim the session
        if (claimToken) {
          try {
            const claimResponse = await fetch('/api/sessions/claim', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                claimToken,
                userId: data.userId,
              }),
            });

            if (claimResponse.ok) {
              const claimData = await claimResponse.json();
              setSession(claimData.session);
            }
          } catch (error) {
            console.error('Failed to claim session:', error);
          }
        }

        // Show success message in phone window
        setSuccess(true);
        setIsLoading(false);
        return;
      }

      // No opener - direct navigation (normal flow)
      // Set auth state
      setAuth(data.userId, data.email);

      // If we have a claim token, claim the session
      if (claimToken) {
        try {
          const claimResponse = await fetch('/api/sessions/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              claimToken,
              userId: data.userId,
            }),
          });

          if (claimResponse.ok) {
            const claimData = await claimResponse.json();
            setSession(claimData.session);
            setSuccess(true);
          } else {
            const claimError = await claimResponse.json();
            if (claimResponse.status === 410) {
              setError('Session has expired and can no longer be claimed.');
              setIsLoading(false);
              return;
            }
            setError(claimError.error || 'Failed to claim session');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to claim session:', error);
          setError('Failed to claim session');
          setIsLoading(false);
          return;
        }
      } else {
        // No claim token - just sign in (pre-session)
        // Create session owned by user and route to Game Modes Home
        try {
          const sessionResponse = await fetch('/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.userId }),
          });
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            setSession(sessionData.session);
            // Set pending toast for START origin (will show after Home loads)
            if (origin === 'START') {
              setPendingToast({ message: 'Signed in', type: 'success' });
            }
            router.push('/play');
            return;
          }
        } catch (error) {
          console.error('Failed to create session:', error);
        }
        // If session creation fails, still show success (user can navigate manually)
        setSuccess(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  if (success) {
    // Check if this window was opened by another window (phone auth simulation)
    const hasOpener = typeof window !== 'undefined' && window.opener && !window.opener.closed;

    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  {mode === 'signup' ? 'Account verified ✅' : 'Signed in successfully ✅'}
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {mode === 'signup'
                    ? (origin === 'POST_SESSION_SAVE'
                      ? 'Saving your session now… Return to the range screen.'
                      : 'You\'re signed in. Return to the range screen.')
                    : 'Return to the range screen to continue.'}
                </p>
                {/* Only show buttons if window was opened directly (not from another window) */}
                {!hasOpener && (
                  <>
                    {claimToken ? (
                      <button
                        onClick={() => router.push('/end')}
                        className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                      >
                        VIEW SESSION
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push('/play')}
                        className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                      >
                        GO TO GAME MODES
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  // Build back URL (not used - phone auth pages don't show back button)
  const getBackUrl = () => {
    return `/auth?origin=${origin || 'START'}`;
  };

  // Get device context text
  const getDeviceContext = () => {
    // Mock device context - in real app, this would come from QR params or session
    return 'Golf Range — Bay 1';
  };

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel">
        <TopNav />
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl p-12">
              {/* Device context */}
              <div className="mb-6 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {mode === 'signup' ? 'Creating account for:' : 'Signing in to:'}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  {getDeviceContext()}
                </p>
              </div>

              <div className="mb-6 text-center">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  {mode === 'signup' ? 'Create account' : 'Sign in'}
                </h2>
                {mode === 'signin' && (
                  <p className="text-sm text-gray-600">
                    This will connect your session to your account.
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent text-lg"
                    placeholder="you@example.com"
                  />
                  {mode === 'signup' && (
                    <p className="mt-1 text-xs text-gray-500">
                      We'll email you a 6-digit code to verify your account.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent text-lg"
                    placeholder="••••••••"
                  />
                </div>

                {/* Phone number field (only for signup) */}
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="phoneNumber"
                      className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide"
                    >
                      Mobile number (optional)
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent text-lg"
                      placeholder="+1 (555) 123-4567"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used for account recovery (optional).
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isLoading ? 'PROCESSING...' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                </button>
              </form>

              {/* Subtle mode switch link */}
              <div className="mt-6 text-center">
                {mode === 'signin' ? (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('mode', 'signup');
                      if (origin) params.set('origin', origin);
                      if (claimToken) params.set('claimToken', claimToken);
                      if (searchParams.get('endedSessionId')) params.set('endedSessionId', searchParams.get('endedSessionId') || '');
                      router.push(`/phone-auth?${params.toString()}`);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    New here? Create an account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('mode', 'signin');
                      if (origin) params.set('origin', origin);
                      if (claimToken) params.set('claimToken', claimToken);
                      if (searchParams.get('endedSessionId')) params.set('endedSessionId', searchParams.get('endedSessionId') || '');
                      router.push(`/phone-auth?${params.toString()}`);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Already have an account? Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}
