'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useToastStore } from '@/store/toastStore';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const origin = searchParams.get('origin') || 'START';
  const endedSessionId = searchParams.get('endedSessionId');
  const inSession = searchParams.get('inSession') === '1';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { showToast } = useToast();
  const { setAuth } = useAuthStore();
  const { setSession } = useSessionStore();
  const { setPendingToast } = useToastStore();

  // Build back URL based on origin
  const getBackUrl = () => {
    const params = new URLSearchParams();
    if (origin) params.set('origin', origin);
    if (endedSessionId) params.set('endedSessionId', endedSessionId);
    if (inSession) params.set('inSession', '1');
    return `/auth?mode=signup&${params.toString()}`;
  };

  // Contextual message removed - we now auto-sign-in after verification

  useEffect(() => {
    // Focus first input on mount
    const firstInput = inputRefs.current[0];
    if (firstInput) {
      firstInput.focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValues = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedValues.forEach((char, i) => {
        if (index + i < 6 && /^\d$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      // Focus next empty input or last input
      const nextIndex = Math.min(index + pastedValues.length, 5);
      const nextInput = inputRefs.current[nextIndex];
      if (nextInput) {
        nextInput.focus();
      }
      return;
    }

    if (!/^\d$/.test(value) && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerify = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        setIsLoading(false);
        return;
      }

      // Check if this is a phone auth window (has opener)
      const hasOpener = typeof window !== 'undefined' && window.opener && !window.opener.closed;
      
      // Auto sign-in after verification (API now returns token/user info)
      const { userId, accessToken, refreshToken } = data;
      
      // Clear stored password (no longer needed)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_signup_password');
        sessionStorage.removeItem('pending_signup_email');
      }
      
      // For phone auth windows, send PHONE_AUTH_SUCCESS message (same as sign-in)
      if (hasOpener) {
        const claimToken = searchParams.get('claimToken');
        const endedSessionId = searchParams.get('endedSessionId') || undefined;
        
        // Send PHONE_AUTH_SUCCESS message to opener window (same format as sign-in)
        const authPayload = {
          type: 'PHONE_AUTH_SUCCESS',
          userId,
          email,
          accessToken: accessToken || `mock_token_${userId}_${Date.now()}`,
          refreshToken: refreshToken || `mock_refresh_${userId}_${Date.now()}`,
          origin,
          claimToken: claimToken || undefined,
          endedSessionId,
        };
        
        console.log('[VerifyEmail] Sending PHONE_AUTH_SUCCESS to opener:', authPayload);
        window.opener.postMessage(authPayload, window.location.origin);
        
        // Show success in phone window
        setIsLoading(false);
        const verifiedParams = new URLSearchParams();
        verifiedParams.set('email', email);
        verifiedParams.set('origin', origin);
        verifiedParams.set('phoneAuth', 'true');
        verifiedParams.set('verified', 'true');
        verifiedParams.set('autoSignedIn', 'true');
        if (endedSessionId) verifiedParams.set('endedSessionId', endedSessionId);
        router.push(`/account-verified?${verifiedParams.toString()}`);
        return;
      }
      
      // For device (no opener) - auto sign-in immediately
      setAuth(userId, email, accessToken, refreshToken);
      
      // Handle origin-specific flows
      if (origin === 'POST_SESSION_SAVE' && endedSessionId) {
        // Claim/save the ended session to this account
        try {
          const claimResponse = await fetch(`/api/sessions/${endedSessionId}/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });

          if (claimResponse.ok) {
            // Navigate to end screen which will show "Session saved" state
            router.replace(`/end?sessionId=${endedSessionId}`);
            return;
          }
        } catch (error) {
          console.error('Failed to claim session:', error);
        }
      } else if (origin === 'MID_SESSION') {
        // Attach current session to user
        try {
          const currentSessionId = useSessionStore.getState().sessionId;
          if (currentSessionId) {
            const claimResponse = await fetch(`/api/sessions/${currentSessionId}/claim`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            });
            if (claimResponse.ok) {
              const claimData = await claimResponse.json();
              setSession(claimData.session);
            }
          }
        } catch (error) {
          console.error('Failed to claim session:', error);
        }
        setPendingToast({ message: 'Signed in', type: 'success' });
        router.push('/play');
        return;
      } else if (origin === 'START') {
        // Create new session owned by user
        try {
          const sessionResponse = await fetch('/api/sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            setSession(sessionData.session);
          }
        } catch (error) {
          console.error('Failed to create session:', error);
        }
        setPendingToast({ message: 'Signed in', type: 'success' });
        router.push('/play');
        return;
      }
      
      // Fallback: Navigate to account verified page
      const params = new URLSearchParams();
      params.set('email', email);
      params.set('autoSignedIn', 'true');
      if (origin) params.set('origin', origin);
      if (endedSessionId) params.set('endedSessionId', endedSessionId);
      if (inSession) params.set('inSession', '1');
      router.push(`/account-verified?${params.toString()}`);
    } catch (error) {
      console.error('Verification error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend code');
        setIsResending(false);
        return;
      }

      // Clear OTP inputs
      setOtp(['', '', '', '', '', '']);
      const firstInput = inputRefs.current[0];
      if (firstInput) {
        firstInput.focus();
      }
      // Show success message
      setError(''); // Clear any errors
      setResendSuccess(true);
      showToast('New code sent! Check your email.', 'success');
      // Clear success message after a few seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    router.push(getBackUrl());
  };

  if (!email) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <p className="text-gray-600 mb-4">Email is required</p>
                <button
                  onClick={() => router.push('/auth?mode=signup')}
                  className="px-6 py-3 bg-rapsodo-red text-white font-bold uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors"
                >
                  Back to Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel">
        <TopNav />
        <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto py-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg shadow-xl p-12">
              {/* Back button */}
              <button
                onClick={() => router.push(getBackUrl())}
                className="mb-6 flex items-center text-gray-600 hover:text-gray-900 font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>

              <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center uppercase tracking-wide">
                Verify your email
              </h2>
              <p className="text-gray-600 mb-6 text-center">
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to finish creating your account.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {resendSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">New code sent! Check your email.</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                  Verification Code
                </label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleVerify}
                  disabled={isLoading || otp.join('').length !== 6}
                  className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'VERIFYING...' : 'VERIFY'}
                </button>

                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm uppercase tracking-wide disabled:opacity-50"
                >
                  {isResending ? 'SENDING...' : 'RESEND CODE'}
                </button>

                <button
                  onClick={handleChangeEmail}
                  className="w-full px-6 py-2 text-gray-500 hover:text-gray-700 font-medium text-sm"
                >
                  Change email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RangeLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red"></div></div>}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
