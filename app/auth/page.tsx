'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSessionStore } from '@/store/sessionStore';
import { useToastStore } from '@/store/toastStore';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';
import { QRCodeSVG } from 'qrcode.react';

type AuthMode = 'signin' | 'signup';
type AuthStep = 'form' | 'otp' | 'verified';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') || 'signin') as AuthMode;
  const origin = searchParams.get('origin') || 'START';
  const endedSessionId = searchParams.get('endedSessionId');
  const inSession = searchParams.get('inSession') === '1';
  const claimToken = searchParams.get('claimToken');
  const returnUrl = searchParams.get('returnUrl'); // For pairing flow

  const { isAuthed, setAuth } = useAuthStore();
  const { sessionId, setSession, claimSession, provisionalClaimEmail, provisionalClaimToken, setProvisionalClaim, clearProvisionalClaim } = useSessionStore();
  const { setPendingToast } = useToastStore();

  // Internal state
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  
  // Claim form state (for signup mode only)
  const [claimEmail, setClaimEmail] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangeEmailConfirm, setShowChangeEmailConfirm] = useState(false);
  const [isCheckingClaim, setIsCheckingClaim] = useState(true);

  // Route guard: if already authenticated, redirect to Game Modes Home (idle)
  // Exclude POST_SESSION_SAVE origin (transactional auth for legacy ended sessions)
  useEffect(() => {
    if (isAuthed && origin !== 'POST_SESSION_SAVE' && step === 'form') {
      router.push('/play');
    }
  }, [isAuthed, origin, step, router]);

  // Check for existing provisional claim on mount (for signup mode)
  useEffect(() => {
    if (mode === 'signup' && (origin === 'MID_SESSION' || origin === 'POST_SESSION_SAVE')) {
      const checkExistingClaim = async () => {
        setIsCheckingClaim(true);
        try {
          const checkSessionId = origin === 'MID_SESSION' ? sessionId : undefined;
          const checkEndedSessionId = origin === 'POST_SESSION_SAVE' ? endedSessionId : undefined;
          
          if (!checkSessionId && !checkEndedSessionId) {
            setIsCheckingClaim(false);
            return;
          }

          const params = new URLSearchParams();
          if (checkSessionId) params.set('sessionId', checkSessionId);
          if (checkEndedSessionId) params.set('endedSessionId', checkEndedSessionId);

          const response = await fetch(`/api/claims/check?${params.toString()}`);
          const data = await response.json();

          if (data.exists && data.email) {
            setProvisionalClaim(data.email, data.claimToken);
            setClaimEmail(data.email);
          } else {
            // Clear any stale claim state
            clearProvisionalClaim();
          }
        } catch (error) {
          console.error('Failed to check existing claim:', error);
        } finally {
          setIsCheckingClaim(false);
        }
      };

      checkExistingClaim();
    } else {
      setIsCheckingClaim(false);
    }
  }, [mode, origin, sessionId, endedSessionId, setProvisionalClaim, clearProvisionalClaim]);

  // Listen for PHONE_SIGNUP_VERIFIED messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'PHONE_SIGNUP_VERIFIED') {
        const { email: verifiedEmail } = event.data;
        // Switch to signin mode with email prefilled
        setMode('signin');
        setStep('form');
        setEmail(verifiedEmail);
        setError('');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build back URL based on origin
  const getBackUrl = () => {
    if (origin === 'START') {
      return '/play'; // /start now redirects to /play
    } else if (origin === 'POST_SESSION_SAVE') {
      return '/play'; // /end now redirects to /play
    }
    return '/play';
  };

  // Get back button label based on origin
  const getBackLabel = () => {
    if (origin === 'START') {
      return 'Back';
    } else if (origin === 'POST_SESSION_SAVE') {
      return 'Back';
    }
    return 'Back';
  };

  // Handle password field key events for Caps Lock detection
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handlePasswordKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  // Generate QR code URL
  const getQrCodeUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    params.set('mode', mode);
    params.set('origin', origin);
    if (endedSessionId) params.set('endedSessionId', endedSessionId);
    if (inSession) params.set('inSession', '1');
    if (claimToken) params.set('claimToken', claimToken);
    return `${baseUrl}/phone-auth?${params.toString()}`;
  };

  // Handle claim form submission (email-only claim for signup)
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmittingClaim(true);

    try {
      const isOverwrite = !!provisionalClaimEmail && claimEmail !== provisionalClaimEmail;
      
      const response = await fetch('/api/claims/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: claimEmail,
          origin,
          endedSessionId: endedSessionId || undefined,
          sessionId: inSession ? sessionId : undefined,
          overwrite: isOverwrite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Claim already exists - this shouldn't happen if UI is correct, but handle gracefully
          setError(data.error || 'A claim already exists for this session.');
        } else {
          setError(data.error || 'Failed to send email. Please try again.');
        }
        setIsSubmittingClaim(false);
        return;
      }

      // Store claim in session store
      setProvisionalClaim(claimEmail, data.claimToken);

      // Show success state
      setClaimSuccess(true);
      setIsSubmittingClaim(false);
      setShowChangeEmail(false);
      setShowChangeEmailConfirm(false);

      // Handle routing based on origin
      if (origin === 'MID_SESSION') {
        // Show toast and return to play screen
        setPendingToast({ 
          message: 'Session saved temporarily ✅ Check your email to keep it permanently.', 
          type: 'success' 
        });
        // Small delay to show success state, then navigate
        setTimeout(() => {
          router.push('/play');
        }, 1500);
      } else if (origin === 'POST_SESSION_SAVE') {
        // Stay on end screen - will be handled by end page update
        // Navigate back to end screen after a brief delay
        setTimeout(() => {
          router.push(`/end${endedSessionId ? `?sessionId=${endedSessionId}` : ''}`);
        }, 1500);
      } else if (origin === 'START') {
        // Return to start screen
        setTimeout(() => {
          router.push('/start');
        }, 1500);
      }
    } catch (error) {
      console.error('Claim error:', error);
      setError('An error occurred. Please try again.');
      setIsSubmittingClaim(false);
    }
  };

  // Handle resend claim email
  const handleResendClaimEmail = async () => {
    if (!provisionalClaimEmail) return;
    
    setError('');
    setIsSubmittingClaim(true);

    try {
      const response = await fetch('/api/claims/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: provisionalClaimEmail,
          origin,
          endedSessionId: endedSessionId || undefined,
          sessionId: inSession ? sessionId : undefined,
          overwrite: false, // Resend doesn't overwrite
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend email. Please try again.');
        setIsSubmittingClaim(false);
        return;
      }

      setError('');
      setIsSubmittingClaim(false);
    } catch (error) {
      console.error('Resend claim error:', error);
      setError('Failed to resend email. Please try again.');
      setIsSubmittingClaim(false);
    }
  };

  // Handle change email confirmation
  const handleConfirmChangeEmail = () => {
    setShowChangeEmailConfirm(false);
    setShowChangeEmail(true);
    setClaimSuccess(false);
    setError('');
  };

  const handlePhoneAuthSimulation = () => {
    const phoneAuthWindow = window.open(
      getQrCodeUrl(),
      'phoneAuth',
      'width=600,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
    if (phoneAuthWindow) {
      setShowPhoneAuth(true);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
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

      // If signup, move to OTP step
      if (mode === 'signup' && data.verificationRequired) {
        // Store password temporarily for auto sign-in after verification (prototype only)
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending_signup_password', password);
          sessionStorage.setItem('pending_signup_email', email);
        }
        setStep('otp');
        setIsLoading(false);
        // Focus first OTP input
        setTimeout(() => {
          const firstInput = inputRefs.current[0];
          if (firstInput) {
            firstInput.focus();
          }
        }, 100);
        return;
      }

      // Handle sign-in success
      await handleSignInSuccess(data);
    } catch (error) {
      console.error('Auth error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignInSuccess = async (data: { userId: string; email: string }) => {
    // If POST_SESSION_SAVE origin, claim the ended session WITHOUT signing in on device
    // (Legacy flow - kept for backward compatibility with existing ended sessions)
    if (origin === 'POST_SESSION_SAVE' && endedSessionId) {
      try {
        const claimResponse = await fetch(`/api/sessions/${endedSessionId}/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.userId }),
        });

        if (claimResponse.ok) {
          // Redirect to /play (legacy /end now redirects there)
          router.replace('/play');
          return;
        } else {
          const claimError = await claimResponse.json();
          setError(claimError.error || 'Failed to save session. Please try again.');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Failed to claim ended session:', error);
        setError('Failed to save session. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Set auth state for all other origins
    setAuth(data.userId, data.email);

    // Legacy session claiming logic removed - game machine model doesn't use sessions
    // Handle returnUrl for pairing flow
    if (returnUrl) {
      router.push(returnUrl);
      return;
    }

    // Set pending toast for START origin
    if (origin === 'START') {
      setPendingToast({ message: 'Signed in', type: 'success' });
    }
    router.push('/play');
  };

  // OTP handlers
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

    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
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

      // Show verified success state
      setStep('verified');
      setIsLoading(false);
      
      // Clear stored password
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_signup_password');
        sessionStorage.removeItem('pending_signup_email');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
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
      setError('');
    } catch (error) {
      console.error('Resend error:', error);
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setError('');
  };

  const handleBackToSignIn = () => {
    setMode('signin');
    setStep('form');
    setOtp(['', '', '', '', '', '']);
    setError('');
    // Keep email prefilled
  };

  // Handle continue as guest - matches start screen behavior
  const handleContinueAsGuest = async () => {
    try {
      const response = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to start session:', errorData);
        setError(errorData.error || 'Failed to start session. Please try again.');
        return;
      }

      const data = await response.json();
      if (!data.session) {
        console.error('No session in response:', data);
        setError('Failed to start session. Please try again.');
        return;
      }

      console.log('Session created:', data.sessionId, data.session);
      setSession(data.session);
      router.push('/play');
    } catch (error) {
      console.error('Failed to start session:', error);
      setError('Failed to start session. Please try again.');
    }
  };

  // Compute whether to show right panel
  const showRightPanel = mode === 'signin' || (mode === 'signup' && (origin === 'MID_SESSION' || origin === 'POST_SESSION_SAVE'));

  // Don't render if already authenticated (will redirect)
  if (isAuthed && !inSession && origin !== 'POST_SESSION_SAVE' && step === 'form') {
    return null;
  }

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col bg-range-panel">
        <TopNav />

        {/* Header with Back button */}
        <div className="px-8 py-4">
          <button
            onClick={() => {
              if (step === 'otp') {
                handleChangeEmail();
              } else {
                router.push(getBackUrl());
              }
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
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
            {step === 'otp' ? 'Back' : getBackLabel()}
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* QR Code Panel - Full width for START origin signup, half width otherwise */}
          <div className={mode === 'signup' && origin === 'START' ? 'w-full bg-gray-50 flex flex-col items-center justify-center p-12' : 'w-1/2 bg-gray-50 flex flex-col items-center justify-center p-12 border-r border-gray-200'}>
            <div className={`text-center ${mode === 'signup' && origin === 'START' ? 'max-w-3xl' : 'max-w-md'}`}>
              {/* Headline - refined typography for START origin, contextual for MID_SESSION */}
              <h2 className={`${mode === 'signup' && origin === 'START' 
                ? 'text-xl font-semibold text-gray-900 mb-4 uppercase tracking-wide leading-tight' 
                : mode === 'signup' && (origin === 'MID_SESSION' || origin === 'POST_SESSION_SAVE')
                ? 'text-xl font-semibold text-gray-900 mb-4 leading-tight'
                : 'text-2xl font-bold text-gray-900 mb-3 uppercase tracking-wide'}`}>
                {mode === 'signup' && (origin === 'MID_SESSION' || origin === 'POST_SESSION_SAVE')
                  ? 'Create an account to save this session'
                  : mode === 'signup' 
                  ? 'Create account with your phone'
                  : 'SIGN IN WITH YOUR PHONE'}
              </h2>
              
              {/* Subtext area - streamlined for START origin with integrated value prop, contextual for MID_SESSION */}
              {mode === 'signup' && origin === 'START' ? (
                <div className="max-w-xl mx-auto mb-8">
                  <p className="text-base text-gray-600 leading-relaxed">
                    Scan with your camera to save your sessions. You'll verify your email with a 6-digit code.
                  </p>
                </div>
              ) : mode === 'signup' && (origin === 'MID_SESSION' || origin === 'POST_SESSION_SAVE') ? (
                <p className="text-base text-gray-600 mb-8 leading-relaxed">
                  Scan to create an account and save this session permanently.
                </p>
              ) : (
                <p className="text-gray-600 mb-8">
                  Scan with your phone camera for the fastest sign-in.
                </p>
              )}
              
              {/* QR Code with refined card treatment - larger for START origin */}
              <div className={`flex justify-center ${mode === 'signup' && origin === 'START' ? 'mb-6' : 'mb-6'}`}>
                <div className={`bg-white rounded-md shadow-sm border border-gray-100 p-5 ${mode === 'signup' && origin === 'START' ? '' : ''}`}>
                  <QRCodeSVG 
                    value={getQrCodeUrl()} 
                    size={mode === 'signup' && origin === 'START' ? 330 : 280} 
                  />
                </div>
              </div>
              
              {/* Simulate button - de-emphasized styling matching START screen */}
              <div className="mb-8">
                <button
                  onClick={handlePhoneAuthSimulation}
                  className="text-xs text-gray-400 hover:text-gray-600 hover:underline font-medium transition-colors"
                >
                  Simulate phone {mode === 'signup' ? 'sign-up' : 'sign-in'} (demo)
                </button>
              </div>

              {showPhoneAuth && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    Phone auth simulation opened. Complete {mode === 'signup' ? 'sign-up' : 'sign-in'} on the phone page.
                  </p>
                </div>
              )}

              {/* Divider and secondary navigation for START origin signup */}
              {mode === 'signup' && origin === 'START' && (
                <>
                  <div className="w-full max-w-md mx-auto border-t border-gray-200 my-8"></div>
                  <div className="max-w-xl mx-auto space-y-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Or{' '}
                      <button
                        type="button"
                        onClick={handleContinueAsGuest}
                        className="text-sm text-rapsodo-red hover:underline font-medium"
                      >
                        continue as guest
                      </button>
                      {' '}for now{' '}
                      <span className="text-gray-500">— you can create an account later.</span>
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signin');
                          setError('');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900 underline font-medium"
                      >
                        Already have an account? Sign in
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Center divider with "OR" label - only show for signin or when signup has claim form */}
          {showRightPanel && (
            <>
              {/* Vertical divider line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 z-0"></div>
              {/* OR badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">OR</span>
                </div>
              </div>
            </>
          )}

          {/* RIGHT PANEL - Form or Claim - Only show for signin or signup with MID_SESSION/POST_SESSION_SAVE */}
          {showRightPanel && (
            <div className="w-1/2 flex flex-col overflow-y-auto">
              <div className="flex-1 flex items-center justify-center p-12">
                <div className="w-full max-w-md">
                {/* SIGN UP MODE: Show claim form (only for MID_SESSION or POST_SESSION_SAVE) */}
                {mode === 'signup' && step === 'form' ? (
                  // MID_SESSION or POST_SESSION_SAVE: Show email-only claim form
                  <>
                        {isCheckingClaim ? (
                          <div className="text-center py-8">
                            <p className="text-gray-600">Checking session...</p>
                          </div>
                        ) : provisionalClaimEmail && !showChangeEmail && !claimSuccess ? (
                          // Linked state - email already claimed
                          <div className="space-y-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                              Save this session by email
                            </h1>
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800 mb-1 font-medium">Session linked to:</p>
                              <p className="text-sm text-blue-900 font-semibold">{provisionalClaimEmail}</p>
                            </div>
                            <div className="space-y-3">
                              <button
                                onClick={() => {
                                  if (origin === 'MID_SESSION') {
                                    setPendingToast({ 
                                      message: 'Email sent ✅ Finish setup later to keep this session.', 
                                      type: 'success' 
                                    });
                                    router.push('/play');
                                  } else if (origin === 'POST_SESSION_SAVE') {
                                    router.push(`/end${endedSessionId ? `?sessionId=${endedSessionId}` : ''}`);
                                  } else {
                                    router.push('/start');
                                  }
                                }}
                                className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                              >
                                Continue
                              </button>
                              <button
                                onClick={() => setShowChangeEmailConfirm(true)}
                                className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm uppercase tracking-wide border border-gray-300 rounded-lg hover:bg-gray-50"
                              >
                                Change email
                              </button>
                            </div>
                            <div className="mt-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setMode('signin');
                                  setError('');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900 underline"
                              >
                                Already have an account? Sign in
                              </button>
                            </div>
                          </div>
                        ) : claimSuccess ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                              <p className="text-green-800 font-medium mb-2">Session saved temporarily ✅</p>
                              <p className="text-sm text-green-700 mb-1">
                                We've saved your session for 48 hours.
                              </p>
                              <p className="text-sm text-green-700">
                                Follow the link in your email to create your account and keep it permanently.
                              </p>
                            </div>
                            <button
                              onClick={handleResendClaimEmail}
                              disabled={isSubmittingClaim}
                              className="w-full px-6 py-3 text-gray-600 hover:text-gray-900 font-medium text-sm uppercase tracking-wide disabled:opacity-50"
                            >
                              {isSubmittingClaim ? 'SENDING...' : 'Resend email'}
                            </button>
                            <div className="mt-4 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setMode('signin');
                                  setError('');
                                  setClaimSuccess(false);
                                  setClaimEmail('');
                                }}
                                className="text-sm text-gray-600 hover:text-gray-900 underline"
                              >
                                Already have an account? Sign in
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                              Save this session by email
                            </h1>
                            <p className="text-gray-600 mb-2 text-sm">
                              We'll hold your session for 48 hours.
                            </p>
                            <p className="text-gray-500 mb-6 text-sm">
                              Finish account setup later to keep it permanently.
                            </p>

                            {error && (
                              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                              </div>
                            )}

                            <form onSubmit={handleClaimSubmit} className="space-y-4">
                              <div>
                                <label
                                  htmlFor="claimEmail"
                                  className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide"
                                >
                                  Email
                                </label>
                                <input
                                  id="claimEmail"
                                  type="email"
                                  value={claimEmail}
                                  onChange={(e) => setClaimEmail(e.target.value)}
                                  required
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent text-lg"
                                  placeholder="you@example.com"
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={isSubmittingClaim}
                                className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 whitespace-nowrap"
                              >
                                {isSubmittingClaim ? 'SENDING...' : 'Send email'}
                              </button>

                              <div className="mt-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMode('signin');
                                    setError('');
                                  }}
                                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                                >
                                  Already have an account? Sign in
                                </button>
                              </div>
                            </form>
                          </>
                        )}
                        
                        {/* Change email confirmation modal */}
                        {showChangeEmailConfirm && (
                          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
                              <h3 className="text-xl font-bold text-gray-900 mb-4">Replace the email for this session?</h3>
                              <p className="text-gray-600 mb-6">
                                This will overwrite the current email used to save this session.
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setShowChangeEmailConfirm(false)}
                                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleConfirmChangeEmail}
                                  className="flex-1 px-4 py-2 bg-rapsodo-red text-white rounded-lg hover:bg-red-700 font-medium"
                                >
                                  Replace
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                  // SIGN IN MODE or OTP/VERIFIED steps: Show full form
                  <>
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
                      {step === 'otp' 
                        ? 'Verify your email'
                        : step === 'verified'
                        ? 'Account verified ✅'
                        : 'Sign in'}
                    </h1>

                    {step === 'form' && (
                      <>
                        {error && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        )}

                        <form onSubmit={handleFormSubmit} className="space-y-4">
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
                          </div>

                          <div>
                            <label
                              htmlFor="password"
                              className="block text-sm font-bold text-gray-700 mb-1 uppercase tracking-wide"
                            >
                              Password
                            </label>
                            <div className="relative">
                              <input
                                id="password"
                                ref={passwordInputRef}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handlePasswordKeyDown}
                                onKeyUp={handlePasswordKeyUp}
                                required
                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent text-lg"
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {capsLockOn && (
                              <p className="mt-1 text-xs text-amber-600">
                                Caps Lock is on
                              </p>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                          >
                            {isLoading ? 'PROCESSING...' : 'SIGN IN'}
                          </button>

                          {/* Create account link - below Sign In button */}
                          <div className="mt-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setMode('signup');
                                setError('');
                                setClaimSuccess(false);
                                setClaimEmail('');
                              }}
                              className="text-sm text-gray-600 hover:text-gray-900 underline"
                            >
                              New here? Create account
                            </button>
                          </div>
                        </form>
                      </>
                    )}

                    {step === 'otp' && (
                  <>
                    <p className="text-gray-600 mb-6 text-center">
                      We sent a 6-digit code to <strong>{email}</strong>. Enter it below to finish creating your account.
                    </p>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
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
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otp.join('').length !== 6}
                        className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'VERIFYING...' : 'VERIFY'}
                      </button>

                      <button
                        onClick={handleResendOtp}
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
                  </>
                )}

                {step === 'verified' && (
                  <div className="text-center space-y-6">
                    <p className="text-lg text-gray-700">
                      Account verified ✅ You can now sign in.
                    </p>
                    <button
                      onClick={handleBackToSignIn}
                      className="w-full px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                    >
                      Back to sign in
                    </button>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </RangeLayout>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red"></div></div>}>
      <AuthPageContent />
    </Suspense>
  );
}
