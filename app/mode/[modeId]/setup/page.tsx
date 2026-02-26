'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getModeDisplayName, isValidModeId } from '@/lib/gameModes';
import { useGameModeStore, type Player } from '@/store/gameModeStore';
import { useLinkedAccountsStore } from '@/store/linkedAccountsStore';
import { useGuestProfilesStore } from '@/store/guestProfilesStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/contexts/ToastContext';
import { type GuestColorToken } from '@/lib/guestColors';
import { formatDisplayName } from '@/lib/nameFormatting';
import RangeLayout from '@/components/RangeLayout';
import TopNav from '@/components/TopNav';
import Link from 'next/link';
import PlayerSlotGrid from '@/components/PlayerSlotGrid';
import AddPlayerPicker from '@/components/AddPlayerPicker';
import SignInModal from '@/components/SignInModal';
import CreateAccountModal from '@/components/CreateAccountModal';
import AddGuestModal from '@/components/AddGuestModal';

export default function ModeSetupPage() {
  const router = useRouter();
  const params = useParams();
  const modeId = params.modeId as string;
  const displayName = getModeDisplayName(modeId);
  const { showToast } = useToast();
  
  // Dev-only delay to ensure loading state shows
  const [isLoading, setIsLoading] = useState(process.env.NODE_ENV !== 'production');
  
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 675); // 675ms delay in development (1.5x of 450ms)
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const {
    selectedModeId,
    selectedPlayers,
    setMode,
    setPlayerAtSlot,
    resetForMode,
    getFilledSlotsCount,
  } = useGameModeStore();

  const { linkedAccounts, hydrateFromAuthStore } = useLinkedAccountsStore();
  const { guestProfiles } = useGuestProfilesStore();
  const { isAuthed, userId, email } = useAuthStore();

  // UI state
  const [pickerOpenSlotIndex, setPickerOpenSlotIndex] = useState<number | null>(null);
  const [currentAnchorRef, setCurrentAnchorRef] = useState<React.RefObject<HTMLButtonElement> | undefined>(undefined);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [creationOrigin, setCreationOrigin] = useState<'none' | 'created-from-setup'>('none');

  // Initialize mode on mount
  useEffect(() => {
    if (isValidModeId(modeId)) {
      if (selectedModeId !== modeId) {
        resetForMode(modeId);
      } else {
        setMode(modeId);
      }
    }
  }, [modeId, selectedModeId, setMode, resetForMode]);

  // Hydrate linked accounts from authStore if empty
  useEffect(() => {
    if (linkedAccounts.length === 0 && isAuthed && userId && email) {
      hydrateFromAuthStore();
    }
  }, [linkedAccounts.length, isAuthed, userId, email, hydrateFromAuthStore]);

  // Show loading state in development
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Background Image with Overlay - same as setup page */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/game_lobby.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
            <p className="text-xl font-semibold text-white drop-shadow-lg">
              Loading {displayName || 'game mode'}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle unknown modeId
  if (!isValidModeId(modeId) || !displayName) {
    return (
      <RangeLayout>
        <div className="w-full h-full flex flex-col bg-range-panel">
          <TopNav />
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  Unknown Mode
                </h2>
                <p className="text-gray-600 mb-8">
                  The game mode "{modeId}" is not recognized.
                </p>
                <Link
                  href="/play"
                  className="inline-block px-8 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </RangeLayout>
    );
  }

  const handleSlotClick = (slotIndex: number, ref: React.RefObject<HTMLButtonElement>) => {
    setPickerOpenSlotIndex(slotIndex);
    setCurrentAnchorRef(ref);
  };

  const handleSelectLinkedAccount = (accountId: string) => {
    const account = linkedAccounts.find((acc) => acc.id === accountId);
    if (!account) return;

    const userId = account.userId || account.id;
    const email = account.email || `${account.displayName.toLowerCase().replace(/\s+/g, '.')}@linked.local`;
    
    // Create a Player object for the slot
    const player: Player = {
      id: `linked-${userId}`,
      type: 'linked',
      displayName: account.displayName,
      linkedAccountId: userId,
    };

    setPlayerAtSlot(pickerOpenSlotIndex!, player);
    setPickerOpenSlotIndex(null);
    showToast('Account added', 'success');
  };

  const handleSelectGuestProfile = (profileId: string) => {
    const profile = guestProfiles.find((p) => p.id === profileId);
    if (!profile) return;

    // Create a Player object for the slot
    const player: Player = {
      id: `guest-${profile.id}`,
      type: 'guest',
      displayName: profile.name,
      guestColor: profile.colorToken,
    };

    setPlayerAtSlot(pickerOpenSlotIndex!, player);
    setPickerOpenSlotIndex(null);
    showToast('Guest added', 'success');
  };

  const handleOpenSignIn = () => {
    setCreationOrigin('created-from-setup');
    setIsSignInModalOpen(true);
  };

  const handleOpenCreateAccount = () => {
    setCreationOrigin('created-from-setup');
    setIsCreateAccountModalOpen(true);
  };

  const handleOpenAddGuest = () => {
    setCreationOrigin('created-from-setup');
    setIsAddGuestModalOpen(true);
  };

  const findNextEmptySlot = (): number | null => {
    for (let i = 0; i < 8; i++) {
      if (selectedPlayers[i] === null) {
        return i;
      }
    }
    return null;
  };

  const handleAccountLinked = (accountId: string) => {
    if (creationOrigin === 'created-from-setup') {
      // Auto-fill next available slot for newly created accounts
      const nextEmptySlot = findNextEmptySlot();
      if (nextEmptySlot !== null) {
        const account = linkedAccounts.find((acc) => acc.id === accountId);
        if (!account) return;

        // Check if already added
        const userId = account.userId || account.id;
        const alreadyAdded = selectedPlayers.some(
          (p) => p !== null && p.type === 'linked' && p.linkedAccountId === userId
        );
        if (alreadyAdded) {
          showToast('This account is already added', 'info');
          setCreationOrigin('none');
          return;
        }

        const player: Player = {
          id: `linked-${userId}`,
          type: 'linked',
          displayName: account.displayName,
          linkedAccountId: userId,
        };
        setPlayerAtSlot(nextEmptySlot, player);
        showToast('Account added', 'success');
        setPickerOpenSlotIndex(null);
        setCreationOrigin('none');
      } else {
        // No empty slots - fallback to active slot if empty, else toast
        if (pickerOpenSlotIndex !== null && selectedPlayers[pickerOpenSlotIndex] === null) {
          handleSelectLinkedAccount(accountId);
        } else {
          showToast('No empty slots available', 'info');
        }
        setCreationOrigin('none');
      }
    } else {
      // Existing account selected from picker - fill the clicked slot
      if (pickerOpenSlotIndex !== null) {
        handleSelectLinkedAccount(accountId);
      }
    }
  };

  const handleAccountCreated = (accountId: string) => {
    // This callback is called when account is created (after Step 3)
    // But we want to wait for Step 4 completion via onComplete instead
    // Keeping this for backwards compatibility but it won't be used for setup flow
    if (creationOrigin === 'created-from-setup') {
      // Auto-fill next available slot for newly created accounts
      const nextEmptySlot = findNextEmptySlot();
      if (nextEmptySlot !== null) {
        const account = linkedAccounts.find((acc) => acc.id === accountId);
        if (!account) return;

        // Check if already added
        const userId = account.userId || account.id;
        const alreadyAdded = selectedPlayers.some(
          (p) => p !== null && p.type === 'linked' && p.linkedAccountId === userId
        );
        if (alreadyAdded) {
          showToast('This account is already added', 'info');
          setCreationOrigin('none');
          return;
        }

        const player: Player = {
          id: `linked-${userId}`,
          type: 'linked',
          displayName: account.displayName,
          linkedAccountId: userId,
        };
        setPlayerAtSlot(nextEmptySlot, player);
        showToast('Account added', 'success');
        setPickerOpenSlotIndex(null);
        setCreationOrigin('none');
      } else {
        // No empty slots - fallback to active slot if empty, else toast
        if (pickerOpenSlotIndex !== null && selectedPlayers[pickerOpenSlotIndex] === null) {
          handleSelectLinkedAccount(accountId);
        } else {
          showToast('No empty slots available', 'info');
        }
        setCreationOrigin('none');
      }
    } else {
      // Should not happen for created accounts, but fallback
      if (pickerOpenSlotIndex !== null) {
        handleSelectLinkedAccount(accountId);
      }
    }
  };

  const handleCreateAccountComplete = (result?: { accountId: string; displayName: string; email: string }) => {
    console.log('[Setup] handleCreateAccountComplete called with result:', result);
    if (!result) {
      console.log('[Setup] No result provided, skipping slot assignment');
      setCreationOrigin('none');
      return;
    }

    if (creationOrigin === 'created-from-setup') {
      // Auto-fill next available slot for newly created accounts
      const nextEmptySlot = findNextEmptySlot();
      console.log('[Setup] Next empty slot for create account:', nextEmptySlot);
      
      if (nextEmptySlot !== null) {
        // Check if already added
        const userId = result.accountId;
        const alreadyAdded = selectedPlayers.some(
          (p) => p !== null && p.type === 'linked' && p.linkedAccountId === userId
        );
        if (alreadyAdded) {
          showToast('This account is already added', 'info');
          setCreationOrigin('none');
          return;
        }

        const player: Player = {
          id: `linked-${userId}`,
          type: 'linked',
          displayName: result.displayName,
          linkedAccountId: userId,
        };
        console.log('[Setup] Setting player at slot', nextEmptySlot, ':', player);
        setPlayerAtSlot(nextEmptySlot, player);
        showToast(`Added ${result.displayName}`, 'success');
        setPickerOpenSlotIndex(null);
        setCreationOrigin('none');
      } else {
        // No empty slots
        showToast('No empty player slots', 'info');
        setCreationOrigin('none');
      }
    } else {
      setCreationOrigin('none');
    }
  };

  const handleGuestCreated = (profile: { id: string; name: string; colorToken: GuestColorToken }) => {
    console.log('[Setup] handleGuestCreated called with profile:', profile);
    if (creationOrigin === 'created-from-setup') {
      // Auto-fill next available slot for newly created guests
      const nextEmptySlot = findNextEmptySlot();
      console.log('[Setup] Next empty slot:', nextEmptySlot);
      if (nextEmptySlot !== null) {
        // Check if already added (by name and color)
        const alreadyAdded = selectedPlayers.some(
          (p) => p !== null && 
            p.type === 'guest' && 
            p.displayName === profile.name && 
            p.guestColor === profile.colorToken
        );
        if (alreadyAdded) {
          showToast('This guest is already added', 'info');
          setCreationOrigin('none');
          return;
        }

        const player: Player = {
          id: `guest-${profile.id}`,
          type: 'guest',
          displayName: profile.name,
          guestColor: profile.colorToken,
        };
        console.log('[Setup] Setting player at slot', nextEmptySlot, ':', player);
        setPlayerAtSlot(nextEmptySlot, player);
        showToast('Guest added', 'success');
        setPickerOpenSlotIndex(null);
        setCreationOrigin('none');
      } else {
        // No empty slots - fallback to active slot if empty, else toast
        if (pickerOpenSlotIndex !== null && selectedPlayers[pickerOpenSlotIndex] === null) {
          handleSelectGuestProfile(profile.id);
        } else {
          showToast('No empty slots available', 'info');
        }
        setCreationOrigin('none');
      }
    } else {
      // Existing guest selected from picker - fill the clicked slot
      if (pickerOpenSlotIndex !== null) {
        handleSelectGuestProfile(profile.id);
      }
    }
  };

  const handleSignedIn = (account: { id: string; name: string; email: string }) => {
    console.log('[Setup] handleSignedIn called with account:', account);
    if (creationOrigin === 'created-from-setup') {
      // Auto-fill next available slot for newly signed-in accounts
      const nextEmptySlot = findNextEmptySlot();
      console.log('[Setup] Next empty slot for sign-in:', nextEmptySlot);
      if (nextEmptySlot !== null) {
        // Check if already added
        const userId = account.id;
        const alreadyAdded = selectedPlayers.some(
          (p) => p !== null && p.type === 'linked' && p.linkedAccountId === userId
        );
        if (alreadyAdded) {
          showToast('This account is already added', 'info');
          setCreationOrigin('none');
          return;
        }

        const player: Player = {
          id: `linked-${userId}`,
          type: 'linked',
          displayName: formatDisplayName(account.name),
          linkedAccountId: userId,
        };
        console.log('[Setup] Setting player at slot', nextEmptySlot, ':', player);
        setPlayerAtSlot(nextEmptySlot, player);
        showToast('Account added', 'success');
        setPickerOpenSlotIndex(null);
        setCreationOrigin('none');
      } else {
        // No empty slots - fallback to active slot if empty, else toast
        if (pickerOpenSlotIndex !== null && selectedPlayers[pickerOpenSlotIndex] === null) {
          handleSelectLinkedAccount(account.id);
        } else {
          showToast('No empty slots available', 'info');
        }
        setCreationOrigin('none');
      }
    }
  };

  const handleContinue = () => {
    const filledCount = getFilledSlotsCount();
    if (filledCount === 0) {
      showToast('Please add at least one player', 'error');
      return;
    }
    setMode(modeId);
    router.push(`/mode/${modeId}/play`);
  };

  const canContinue = getFilledSlotsCount() >= 1;

  // Get already selected account IDs and guest profile IDs
  const alreadySelectedAccountIds = selectedPlayers
    .filter((p): p is Player => p !== null && p.type === 'linked')
    .map((p) => p.linkedAccountId!)
    .filter((id): id is string => id !== undefined);

  const alreadySelectedGuestProfileIds = selectedPlayers
    .filter((p): p is Player => p !== null && p.type === 'guest')
    .map((p) => {
      // Match guest profile by name and color (since we don't store profile ID directly)
      const matchingProfile = guestProfiles.find(
        (profile) => profile.name === p.displayName && profile.colorToken === p.guestColor
      );
      return matchingProfile?.id;
    })
    .filter((id): id is string => id !== undefined);

  return (
    <RangeLayout>
      <div className="w-full h-full flex flex-col relative">
        {/* Background Image with Overlay */}
        <div 
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: 'url(/game_lobby.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <TopNav />

        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {/* Header with Back button */}
          <div className="px-8 py-4">
            <Link
              href="/play"
              className="flex items-center text-white hover:text-gray-200 font-medium drop-shadow-lg"
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
              Back to Home
            </Link>
          </div>

          {/* Content - Left-aligned lobby modal */}
          <div className="flex-1 overflow-hidden px-8 py-4">
            <div className="w-full max-w-4xl ml-0 lg:ml-16 xl:ml-20 h-full flex items-center">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 lg:p-8 w-full max-h-[90vh] overflow-y-auto">
                {/* Mode Header */}
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center uppercase tracking-wide">
                  {displayName}
                </h1>

                {/* Player Slots */}
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Players
                  </h2>
                  <PlayerSlotGrid onSlotClick={handleSlotClick} />
                </div>

                {/* Helper Text */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 text-center">
                    Add up to 8 players. Guests won't keep history unless they create an account.
                  </p>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="w-full px-6 py-4 bg-rapsodo-red text-white font-bold text-xl uppercase tracking-wide rounded-lg hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Player Picker */}
      <AddPlayerPicker
        isOpen={pickerOpenSlotIndex !== null}
        onClose={() => setPickerOpenSlotIndex(null)}
        anchorRef={currentAnchorRef}
        selectedSlotIndex={pickerOpenSlotIndex ?? -1}
        onSelectLinkedAccount={handleSelectLinkedAccount}
        onSelectGuestProfile={handleSelectGuestProfile}
        onOpenSignIn={handleOpenSignIn}
        onOpenCreateAccount={handleOpenCreateAccount}
        onOpenAddGuest={handleOpenAddGuest}
        alreadySelectedAccountIds={alreadySelectedAccountIds}
        alreadySelectedGuestProfileIds={alreadySelectedGuestProfileIds}
      />

      {/* Modals */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => {
          setIsSignInModalOpen(false);
          if (creationOrigin === 'created-from-setup') {
            setCreationOrigin('none');
          }
        }}
        onSelectCreateAccount={() => {
          setIsSignInModalOpen(false);
          setIsCreateAccountModalOpen(true);
          // Keep creationOrigin as 'created-from-setup'
        }}
        onAccountLinked={handleAccountLinked}
        onSignedIn={handleSignedIn}
      />

      <CreateAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => {
          setIsCreateAccountModalOpen(false);
          if (creationOrigin === 'created-from-setup') {
            setCreationOrigin('none');
          }
        }}
        completionMode="return-to-play"
        onComplete={handleCreateAccountComplete}
        onAccountCreated={handleAccountCreated}
      />

      <AddGuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => {
          setIsAddGuestModalOpen(false);
          if (creationOrigin === 'created-from-setup') {
            setCreationOrigin('none');
          }
        }}
        onGuestCreated={(profile) => {
          console.log('[Setup] AddGuestModal callback received profile:', profile);
          handleGuestCreated(profile);
        }}
      />
    </RangeLayout>
  );
}
