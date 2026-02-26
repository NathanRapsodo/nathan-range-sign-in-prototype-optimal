'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNextMockAccount, getAllMockAccounts } from '@/lib/mockAccountPicker';
import type { MockAccount } from '@/lib/mockAccounts';
import { QRCodeSVG } from 'qrcode.react';
import { APP_DOWNLOAD_URL } from '@/lib/constants';
import { maskEmail } from '@/lib/emailMasking';
import { formatDisplayNameFromParts, formatDisplayName } from '@/lib/nameFormatting';

type Tab = 'signin' | 'create';
type State = 'form' | 'linking' | 'success';
type CreateStep = 1 | 2 | 3 | 4;

function WebSimPageContent() {
  const searchParams = useSearchParams();
  const bayId = searchParams.get('bay') || 'bay-001';
  const token = searchParams.get('token') || '';
  
  const [tab, setTab] = useState<Tab>('signin');
  const [state, setState] = useState<State>('form');
  const [selectedAccount, setSelectedAccount] = useState<MockAccount>(getNextMockAccount());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  // Create account step state
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedPromotions, setAcceptedPromotions] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createdAccountEmail, setCreatedAccountEmail] = useState('');

  // Prefill form when account changes (only for signin tab)
  useEffect(() => {
    if (tab === 'signin') {
      setEmail(selectedAccount.email);
      setPassword(selectedAccount.password);
    } else {
      // Reset create account form when switching to create tab
      setFirstName('');
      setLastName('');
      setCreateEmail('');
      setCreatePassword('');
      setConfirmPassword('');
      setAcceptedTerms(false);
      setAcceptedPromotions(false);
      setCreateErrors({});
      setCreateStep(1);
    }
  }, [selectedAccount, tab]);

  const handleAccountSelect = (account: MockAccount) => {
    setSelectedAccount(account);
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (password !== 'ilovegolf') {
      setError('Invalid password. Use "ilovegolf" for demo accounts.');
      return;
    }

    setState('linking');
    
    setTimeout(() => {
      setState('success');
      broadcastPairSuccess(bayId, selectedAccount);
    }, 1000);
  };

  const validateCreateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!createEmail.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createEmail)) {
      newErrors.email = 'Invalid email format';
    }
    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCreateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!createPassword) {
      newErrors.password = 'Password is required';
    } else if (createPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (createPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateNext = () => {
    if (createStep === 1) {
      if (validateCreateStep1()) {
        setCreateStep(2);
      }
    } else if (createStep === 2) {
      if (validateCreateStep2()) {
        setCreateStep(3);
      }
    }
  };

  const handleCreateBack = () => {
    if (createStep > 1) {
      setCreateStep((createStep - 1) as CreateStep);
      setCreateErrors({});
    }
  };

  const handleCreateAccount = () => {
    if (!acceptedTerms) {
      setCreateErrors({ terms: 'You must accept the Terms & Conditions' });
      return;
    }

    // Generate account ID
    const accountId = `acct-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const displayName = formatDisplayNameFromParts(firstName, lastName);

    setCreatedAccountEmail(createEmail);
    setCreateStep(4);
    
    // Broadcast account creation to sign in on the main device
    broadcastPairSuccess(bayId, {
      id: accountId,
      name: displayName,
      email: createEmail,
    });
  };

  const broadcastPairSuccess = (bay: string, acc: { id: string; name: string; email: string }) => {
    if (typeof window === 'undefined') return;
    
    try {
      const channel = new BroadcastChannel('bay-pairing');
      channel.postMessage({
        type: 'PAIR_SUCCESS',
        bayId: bay,
        account: {
          id: acc.id,
          name: acc.name,
          email: acc.email,
        },
      });
      channel.close();
    } catch (error) {
      console.error('Failed to broadcast pair success:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-full max-w-[390px] bg-black rounded-[2.5rem] p-2 shadow-2xl">
        {/* Status bar */}
        <div className="bg-black rounded-t-[2rem] px-6 py-2 flex items-center justify-between text-white text-xs">
          <div>9:41</div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            <div className="w-6 h-3 border border-white rounded-sm">
              <div className="w-4 h-2 bg-white rounded-sm m-0.5" />
            </div>
          </div>
        </div>

        {/* Browser address bar */}
        <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-600">
            rapsodogolf.com/pair
          </div>
        </div>

        {/* Screen content */}
        <div className="bg-white rounded-b-[2rem] min-h-[700px] flex flex-col">
          {state === 'form' && (
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Account selector (for demo) - only show on signin tab */}
              {tab === 'signin' && (
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-1">Demo Account:</label>
                  <select
                    value={selectedAccount.id}
                    onChange={(e) => {
                      const account = getAllMockAccounts().find(a => a.id === e.target.value);
                      if (account) handleAccountSelect(account);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {getAllMockAccounts().map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tabs - hide on Step 4 */}
              {createStep < 4 && (
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => {
                      setTab('signin');
                      setError('');
                    }}
                    className={`px-4 py-2 font-medium text-sm ${
                      tab === 'signin'
                        ? 'text-rapsodo-red border-b-2 border-rapsodo-red'
                        : 'text-gray-600'
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      setTab('create');
                      setError('');
                    }}
                    className={`px-4 py-2 font-medium text-sm ${
                      tab === 'create'
                        ? 'text-rapsodo-red border-b-2 border-rapsodo-red'
                        : 'text-gray-600'
                    }`}
                  >
                    Create account
                  </button>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {tab === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Demo password: ilovegolf</p>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-rapsodo-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sign in
                  </button>
                </form>
              ) : createStep < 4 ? (
                // Create account steps 1-3
                <div className="space-y-6">
                  {/* Step indicator */}
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                              createStep >= s
                                ? 'bg-rapsodo-red text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {s}
                          </div>
                          {s < 3 && (
                            <div
                              className={`w-12 h-1 mx-1 ${
                                createStep > s ? 'bg-rapsodo-red' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs text-gray-600 mt-2">
                      Step {createStep} of 3
                    </p>
                  </div>

                  {/* Step 1: Identity */}
                  {createStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                          placeholder="John"
                        />
                        {createErrors.firstName && (
                          <p className="mt-1 text-xs text-red-600">{createErrors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                          placeholder="Doe"
                        />
                        {createErrors.lastName && (
                          <p className="mt-1 text-xs text-red-600">{createErrors.lastName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={createEmail}
                          onChange={(e) => setCreateEmail(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                          placeholder="john@example.com"
                        />
                        {createErrors.email && (
                          <p className="mt-1 text-xs text-red-600">{createErrors.email}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Password */}
                  {createStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={createPassword}
                          onChange={(e) => setCreatePassword(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                          placeholder="Enter password"
                        />
                        {createErrors.password && (
                          <p className="mt-1 text-xs text-red-600">{createErrors.password}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Must be at least 6 characters
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rapsodo-red focus:border-transparent"
                          placeholder="Confirm password"
                        />
                        {createErrors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-600">{createErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Consent */}
                  {createStep === 3 && (
                    <div className="space-y-4">
                      {createErrors.general && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">{createErrors.general}</p>
                        </div>
                      )}
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <input
                            id="terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                            className="mt-1 mr-3 w-4 h-4 text-rapsodo-red border-gray-300 rounded focus:ring-rapsodo-red"
                          />
                          <label htmlFor="terms" className="text-sm text-gray-700">
                            I accept the Terms & Conditions <span className="text-red-500">*</span>
                          </label>
                        </div>
                        {createErrors.terms && (
                          <p className="text-xs text-red-600 ml-7">{createErrors.terms}</p>
                        )}
                        <div className="flex items-start">
                          <input
                            id="promotions"
                            type="checkbox"
                            checked={acceptedPromotions}
                            onChange={(e) => setAcceptedPromotions(e.target.checked)}
                            className="mt-1 mr-3 w-4 h-4 text-rapsodo-red border-gray-300 rounded focus:ring-rapsodo-red"
                          />
                          <label htmlFor="promotions" className="text-sm text-gray-700">
                            I'd like to receive offers and promotions (optional)
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  <div className="flex gap-3 mt-6">
                    {createStep > 1 && (
                      <button
                        onClick={handleCreateBack}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold text-sm rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Back
                      </button>
                    )}
                    {createStep < 3 ? (
                      <button
                        onClick={handleCreateNext}
                        className="flex-1 px-4 py-2 bg-rapsodo-red text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={handleCreateAccount}
                        className="flex-1 px-4 py-2 bg-rapsodo-red text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Create
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Step 4: Success
                <div className="space-y-6">
                  {/* Account creation success - primary message */}
                  <div className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
                      Account created
                    </h3>
                    <p className="text-base text-gray-700 mb-3 font-medium">
                      You've been signed in on the Range device.
                    </p>
                    {createdAccountEmail && (
                      <p className="text-sm text-gray-600 mb-3">
                        We've sent a verification email to: <span className="font-medium">{maskEmail(createdAccountEmail)}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-6">
                      Please follow the instructions to unlock the full experience.
                    </p>
                    
                    {/* Enjoy your game message - simple text, no button styling */}
                    <p className="text-lg font-semibold text-gray-800 uppercase tracking-wide">
                      Enjoy your game
                    </p>
                  </div>

                  {/* App promotion panel - secondary */}
                  <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-200">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-1.5 uppercase tracking-wide">
                        Get the app
                      </h3>
                      <p className="text-sm text-gray-700 font-medium">
                        Link faster. Save plays. Own your progress.
                      </p>
                    </div>
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700">Scan once to link to any bay</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700">All your plays & results in one place</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-700">Start games quicker with saved profiles</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-blue-200">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Scan to download the app
                        </p>
                        <div className="flex justify-center">
                          <div className="bg-white rounded-lg shadow-md border border-blue-200 p-3">
                            <QRCodeSVG value={APP_DOWNLOAD_URL} size={110} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {state === 'linking' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red mb-4"></div>
              <p className="text-lg font-medium text-gray-900">Linking…</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Linked!</h1>
              <p className="text-gray-600">
                Your account is now connected to this bay.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebSimPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rapsodo-red"></div></div>}>
      <WebSimPageContent />
    </Suspense>
  );
}
