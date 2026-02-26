# Refactor Audit & Implementation Plan
## sign-in-prototype-optimal

**Date:** 2024  
**Purpose:** Large refactor from session-based to game-mode-based kiosk with linked accounts

---

## 1. Home Screen Component Analysis

### 1.1 Mode Tiles Location
**File:** `app/play/page.tsx` (lines 158-160)  
**Component:** `TileGrid` (imported from `components/TileGrid.tsx`)

### 1.2 Current Implementation
- **TileGrid Component:** `components/TileGrid.tsx`
  - Renders 4 static tiles: RANGE, TARGET RANGE, COURSES, CLOSEST TO PIN
  - Uses `TileCard` component for each tile
  - Grid layout: `grid-cols-4 gap-6`
  - **Current state:** Tiles are unclickable (`cursor-default` in TileCard)

- **TileCard Component:** `components/TileCard.tsx`
  - Displays title, description, and gradient background
  - No onClick handler or routing logic
  - Purely presentational

### 1.3 Current Wiring
- Tiles are rendered in `/play` page, which is the "Game Modes Home" (idle screen)
- `/play` page requires an active session (`sessionId`) to render
- If no session exists, redirects to `/start`
- Tiles have no navigation or interaction handlers

---

## 2. Auth-Related UI Analysis

### 2.1 QR Code Flows
**Location:** `app/auth/page.tsx`

**QR Code Generation:**
- Lines 161-171: `getQrCodeUrl()` function generates QR code URL
- Uses `qrcode.react` library (`QRCodeSVG` component)
- QR code links to `/phone-auth` with query params (mode, origin, claimToken, etc.)
- Displayed in left panel of auth page (lines 692-700)

**Phone Auth Page:** `app/phone-auth/page.tsx`
- Handles phone-based sign-in/sign-up
- Can be opened via QR code scan
- Sends postMessage to opener window on success

### 2.2 Account Icon UI
**Location:** `components/TopNav.tsx` (lines 95-183)

**Current Implementation:**
- Account icon/menu button in top-right (lines 96-120)
- Shows user avatar (email initial) if authenticated, generic icon if guest
- Dropdown menu (lines 132-181):
  - **Guest state:** Shows "Sign in to save this session" + Cancel
  - **Authenticated state:** Shows account details (email, display name) - informational only
- Menu opens/closes on click (lines 97-98)
- No logout functionality in current menu

### 2.3 End Session Button
**Location:** `app/play/page.tsx` (lines 163-174)

**Current Implementation:**
- Footer button: "End & save session" (if authed) or "END SESSION" (if guest)
- Calls `handleEndSession()` which uses `endSessionAndNavigate()` helper
- Located in footer section below tile grid
- Also accessible via TopNav menu (indirectly through account menu, but not directly visible)

**End Session Screen:** `app/end/page.tsx`
- Shows session summary (shots, avg carry, avg ball speed)
- Guest sessions: Shows "Save your session" CTA + "Exit without saving"
- User sessions: Shows "SESSION COMPLETE" with saved confirmation

### 2.4 Summary of Auth UI Locations
| UI Element | File | Lines | Notes |
|------------|------|-------|-------|
| QR Code Display | `app/auth/page.tsx` | 692-700 | Left panel, uses QRCodeSVG |
| Account Icon | `components/TopNav.tsx` | 96-120 | Top-right, conditional rendering |
| Account Menu | `components/TopNav.tsx` | 132-181 | Dropdown, guest vs authenticated states |
| End Session Button | `app/play/page.tsx` | 166-172 | Footer, conditional text |
| End Session Screen | `app/end/page.tsx` | Full file | Post-session summary & save CTA |

---

## 3. Routing Structure Analysis

### 3.1 App Router Structure
```
app/
├── layout.tsx                    # Root layout with ToastProvider, InactivityManager, PhoneAuthListener
├── page.tsx                      # Splash screen (/) - routes to /start
├── start/
│   └── page.tsx                 # Start session screen (guest/sign-in CTA)
├── play/
│   └── page.tsx                 # Game Modes Home (idle) - shows TileGrid
├── auth/
│   └── page.tsx                 # Sign-in/sign-up with QR code
├── phone-auth/
│   └── page.tsx                 # Phone-based auth (opened via QR)
├── verify-email/
│   └── page.tsx                 # Email OTP verification
├── account-verified/
│   └── page.tsx                 # Post-verification confirmation
├── end/
│   └── page.tsx                 # End session screen
├── session-saved/
│   └── page.tsx                 # Post-save confirmation (unused?)
├── r-cloud/
│   └── page.tsx                 # R-Cloud integration (unused?)
└── api/
    ├── auth/
    │   ├── signin/route.ts
    │   ├── signup/route.ts
    │   ├── verify-email-otp/route.ts
    │   └── resend-email-otp/route.ts
    ├── claims/
    │   ├── check/route.ts
    │   └── create/route.ts
    └── sessions/
        ├── start/route.ts
        ├── [id]/route.ts
        ├── [id]/claim/route.ts
        ├── claim/route.ts
        └── sync/route.ts
```

### 3.2 Current Route Flow
1. **Splash** (`/`) → Click → `/start`
2. **Start** (`/start`) → Guest or Sign-in → `/play` (with session)
3. **Play** (`/play`) → Shows TileGrid (idle) → End Session → `/end`
4. **End** (`/end`) → Done → `/` (splash)

### 3.3 Layouts & Providers
**Root Layout:** `app/layout.tsx`
- Wraps app with:
  - `ToastProvider` (Context API)
  - `InactivityManager` (component)
  - `PhoneAuthListener` (component)
- No nested layouts currently

**RangeLayout Component:** `components/RangeLayout.tsx`
- Wrapper component used on most pages
- Provides bezel effect (optional)
- Used by: splash, start, play, auth, end, phone-auth, etc.

---

## 4. State Management Analysis

### 4.1 Current Approach
**Library:** Zustand (v4.4.7)

### 4.2 Stores

#### 4.2.1 Auth Store
**File:** `store/authStore.ts`

**State Shape:**
```typescript
{
  isAuthed: boolean;
  userId?: string;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
}
```

**Actions:**
- `setAuth(userId, email, accessToken?, refreshToken?)` - Sets auth state
- `clearAuth()` - Clears auth state

**Persistence:** Memory-only (no localStorage)

#### 4.2.2 Session Store
**File:** `store/sessionStore.ts`

**State Shape:**
```typescript
{
  sessionId?: string;
  ownerType?: 'guest' | 'user';
  userId?: string;
  claimToken?: string;
  claimExpiresAt?: number;
  shots: Shot[];
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'failed';
  startedAt?: number;
  provisionalClaimEmail?: string;
  provisionalClaimToken?: string;
}
```

**Actions:**
- `setSession(session: Session)` - Sets session state + persists recovery metadata
- `setSyncStatus(status)` - Updates sync status
- `clearSession()` - Clears session state
- `claimSession(userId)` - Claims session for user
- `setProvisionalClaim(email, claimToken?)` - Sets provisional claim
- `clearProvisionalClaim()` - Clears provisional claim

**Persistence:** Recovery metadata only (sessionId, startedAt) in localStorage

#### 4.2.3 Toast Store
**File:** `store/toastStore.ts`

**State Shape:**
```typescript
{
  pendingToast: { message: string; type: 'success' | 'error' | 'info' } | null;
}
```

**Actions:**
- `setPendingToast(toast)` - Sets pending toast

**Persistence:** Memory-only

### 4.3 Context API
**ToastContext:** `contexts/ToastContext.tsx`
- Provides `useToast()` hook
- Wraps Zustand toast store with React Context
- Used for displaying toast notifications

### 4.4 Current State Usage for Auth/Session
- **Auth state:** Used to determine if user is signed in, show account icon, conditional UI
- **Session state:** Used to gate access to `/play`, track shots, manage session lifecycle
- **Session recovery:** localStorage stores minimal metadata for session recovery on page reload

---

## 5. Proposed State Model

### 5.1 New Store Structure

#### 5.1.1 Bay Store (New)
**File:** `store/bayStore.ts`

```typescript
interface BayState {
  bayId: string | null;
  bayName?: string; // e.g., "Bay 1"
  isPaired: boolean; // Whether bay is paired with a device/QR
  pairingCode?: string; // QR code data for pairing
  pairingExpiresAt?: number; // When pairing code expires
}

interface BayStore extends BayState {
  setBay: (bayId: string, bayName?: string) => void;
  setPairing: (code: string, expiresAt: number) => void;
  clearPairing: () => void;
  clearBay: () => void;
}
```

#### 5.1.2 Linked Accounts Store (New)
**File:** `store/linkedAccountsStore.ts`

```typescript
interface LinkedAccount {
  userId: string;
  email: string;
  displayName: string; // Derived from email
  linkedAt: number; // Timestamp when linked
  isActive: boolean; // Currently selected/active account
  pin?: string; // Optional PIN for quick access (hashed in production)
}

interface LinkedAccountsState {
  linkedAccounts: LinkedAccount[];
  activeAccountId: string | null; // Currently active account
}

interface LinkedAccountsStore extends LinkedAccountsState {
  addLinkedAccount: (account: Omit<LinkedAccount, 'linkedAt' | 'isActive'>) => void;
  removeLinkedAccount: (userId: string) => void;
  setActiveAccount: (userId: string | null) => void;
  clearAllAccounts: () => void;
  getActiveAccount: () => LinkedAccount | null;
}
```

#### 5.1.3 Game Mode Store (New)
**File:** `store/gameModeStore.ts`

```typescript
type GameMode = 'range' | 'target-range' | 'courses' | 'closest-to-pin' | null;

interface PlayConfig {
  mode: GameMode;
  playerId: string | null; // userId or 'guest-{id}'
  playerType: 'user' | 'guest';
  startedAt: number;
  shots: Shot[]; // Shots for this play
}

interface GameModeState {
  selectedMode: GameMode;
  currentPlay: PlayConfig | null; // Active play session
  playHistory: PlayConfig[]; // Completed plays in current "session"
}

interface GameModeStore extends GameModeState {
  selectMode: (mode: GameMode) => void;
  startPlay: (playerId: string, playerType: 'user' | 'guest') => void;
  endPlay: () => void;
  addShot: (shot: Shot) => void;
  clearCurrentPlay: () => void;
  resetMode: () => void;
}
```

#### 5.1.4 Guests Store (New)
**File:** `store/guestsStore.ts`

```typescript
interface Guest {
  id: string; // 'guest-{timestamp}'
  name?: string; // Optional display name
  createdAt: number;
  lastPlayAt?: number;
}

interface GuestsState {
  guests: Guest[];
  activeGuestId: string | null; // Currently selected guest
}

interface GuestsStore extends GuestsState {
  createGuest: (name?: string) => Guest;
  removeGuest: (guestId: string) => void;
  setActiveGuest: (guestId: string | null) => void;
  clearAllGuests: () => void;
  getActiveGuest: () => Guest | null;
}
```

#### 5.1.5 Updated Auth Store
**File:** `store/authStore.ts` (Modified)

```typescript
// Remove session-related state
// Keep only device-level auth state (if needed for admin/system functions)
// Most auth will be per-linked-account via linkedAccountsStore

interface AuthState {
  // Minimal - may not be needed if all auth is via linked accounts
  // Keep for backward compatibility during migration
  isAuthed: boolean; // Deprecated - use linkedAccountsStore instead
  userId?: string; // Deprecated
  email?: string; // Deprecated
}

interface AuthStore extends AuthState {
  // Keep for migration period
  setAuth: (userId: string, email: string) => void;
  clearAuth: () => void;
}
```

#### 5.1.6 Deprecated Session Store
**File:** `store/sessionStore.ts` (To be deprecated)

- Will be replaced by `gameModeStore` and `linkedAccountsStore`
- Keep for migration period, then remove

### 5.2 Complete State Model Summary

```typescript
// Top-level state shape
interface AppState {
  // Bay
  bay: {
    bayId: string | null;
    bayName?: string;
    isPaired: boolean;
    pairingCode?: string;
    pairingExpiresAt?: number;
  };
  
  // Linked Accounts (replaces single auth)
  linkedAccounts: {
    accounts: LinkedAccount[];
    activeAccountId: string | null;
  };
  
  // Guests
  guests: {
    list: Guest[];
    activeGuestId: string | null;
  };
  
  // Game Mode & Play
  gameMode: {
    selectedMode: GameMode;
    currentPlay: PlayConfig | null;
    playHistory: PlayConfig[];
  };
  
  // Legacy (during migration)
  auth: AuthState; // Deprecated
  session: SessionState; // Deprecated
}
```

---

## 6. Step-by-Step Refactor Plan

### Increment 1: Mode Tile Routing Skeleton
**Goal:** Make tiles clickable and route to mode selection screens (placeholder)

**Changes:**
1. Update `TileCard.tsx` to accept `onClick` prop
2. Update `TileGrid.tsx` to handle tile clicks and route
3. Create placeholder routes: `/mode/range`, `/mode/target-range`, `/mode/courses`, `/mode/closest-to-pin`
4. Create placeholder mode selection pages

**Files to Touch:**
- `components/TileCard.tsx`
- `components/TileGrid.tsx`
- `app/play/page.tsx` (minor - pass router)
- `app/mode/[mode]/page.tsx` (new - dynamic route)
- `app/mode/[mode]/layout.tsx` (new - optional, for shared layout)

**Test Checklist:**
- [ ] Tiles are clickable (cursor pointer)
- [ ] Clicking each tile routes to correct `/mode/{mode}` page
- [ ] Placeholder pages render with mode name
- [ ] Back navigation works from mode pages

---

### Increment 2: Player Selection Screen
**Goal:** Add player selection screen after mode selection

**Changes:**
1. Create `/mode/[mode]/players/page.tsx` route
2. Create `components/PlayerSelection.tsx` component
3. Show linked accounts + guests + "Add Guest" option
4. Wire up selection to game mode store

**Files to Touch:**
- `app/mode/[mode]/players/page.tsx` (new)
- `components/PlayerSelection.tsx` (new)
- `store/linkedAccountsStore.ts` (new)
- `store/guestsStore.ts` (new)
- `app/mode/[mode]/page.tsx` (update to route to players)

**Test Checklist:**
- [ ] Mode selection routes to player selection
- [ ] Player selection shows linked accounts (empty initially)
- [ ] Player selection shows guests list
- [ ] "Add Guest" creates new guest
- [ ] Selecting player routes to play screen

---

### Increment 3: Game Mode Store & Play Flow
**Goal:** Implement game mode state management and basic play screen

**Changes:**
1. Create `store/gameModeStore.ts`
2. Create placeholder `/play/[mode]/page.tsx` route
3. Wire up mode selection → player selection → play flow
4. Update navigation to use game mode store

**Files to Touch:**
- `store/gameModeStore.ts` (new)
- `app/play/[mode]/page.tsx` (new)
- `app/mode/[mode]/players/page.tsx` (update to start play)
- `components/PlayerSelection.tsx` (update to use store)

**Test Checklist:**
- [ ] Game mode store tracks selected mode
- [ ] Play screen receives mode from store
- [ ] Play screen shows placeholder content
- [ ] Navigation flow: Home → Mode → Players → Play works

---

### Increment 4: Linked Accounts UI (Drawer/Modal)
**Goal:** Replace account icon with Linked Accounts surface

**Changes:**
1. Create `components/LinkedAccountsDrawer.tsx` (or Modal)
2. Update `TopNav.tsx` to open drawer instead of dropdown
3. Implement add/remove linked account flows
4. Wire up QR + PIN pairing flow

**Files to Touch:**
- `components/LinkedAccountsDrawer.tsx` (new)
- `components/TopNav.tsx` (major refactor)
- `store/linkedAccountsStore.ts` (implement actions)
- `store/bayStore.ts` (new - for pairing state)
- `app/auth/page.tsx` (update for linking flow)

**Test Checklist:**
- [ ] Account icon opens Linked Accounts drawer
- [ ] Drawer shows list of linked accounts
- [ ] "Link Account" button opens QR flow
- [ ] QR code generates with pairing code
- [ ] PIN entry works (if implemented)
- [ ] Removing account works
- [ ] Active account is highlighted

---

### Increment 5: Remove Session Concept & End Session UI
**Goal:** Remove session-based flows, update end session to per-account logout

**Changes:**
1. Remove "End Session" button from `/play` footer
2. Update Linked Accounts drawer to show "Sign Out" per account
3. Remove session store usage (keep for migration)
4. Update `/end` page to be play-completion screen (not session-end)
5. Remove `/start` route (home is now `/play`)

**Files to Touch:**
- `app/play/page.tsx` (remove end session button)
- `components/LinkedAccountsDrawer.tsx` (add sign out per account)
- `app/end/page.tsx` (refactor to play completion)
- `app/start/page.tsx` (deprecate or redirect)
- `app/page.tsx` (update splash to route to `/play`)

**Test Checklist:**
- [ ] No "End Session" button on home screen
- [ ] Linked Accounts drawer shows "Sign Out" per account
- [ ] Signing out removes account from linked accounts
- [ ] Play completion screen shows after play ends
- [ ] Home screen accessible without "starting session"

---

### Increment 6: Guest Management & Upgrade Flow
**Goal:** Implement guest creation, management, and upgrade flow

**Changes:**
1. Complete guest store implementation
2. Add "Upgrade Guest" flow in Linked Accounts drawer
3. Remove upgrade CTAs from play completion
4. Add guest-to-account conversion flow

**Files to Touch:**
- `store/guestsStore.ts` (complete implementation)
- `components/LinkedAccountsDrawer.tsx` (add upgrade flow)
- `app/play/[mode]/page.tsx` (remove upgrade CTAs)
- `app/end/page.tsx` (remove upgrade CTAs)

**Test Checklist:**
- [ ] Guests can be created and selected
- [ ] Guest appears in Linked Accounts drawer
- [ ] "Upgrade Guest" converts guest to linked account
- [ ] No upgrade CTAs after play completion
- [ ] Upgrade only available from Linked Accounts

---

### Increment 7: Bay Pairing & QR Flow
**Goal:** Implement persistent bay pairing via QR + PIN

**Changes:**
1. Complete bay store implementation
2. Create pairing QR generation flow
3. Implement PIN entry for pairing
4. Persist pairing state (localStorage)
5. Update auth flow to link accounts to bay

**Files to Touch:**
- `store/bayStore.ts` (complete implementation)
- `components/BayPairingModal.tsx` (new)
- `app/auth/page.tsx` (update for bay linking)
- `lib/pairingHelpers.ts` (new - pairing utilities)

**Test Checklist:**
- [ ] Bay pairing QR code generates
- [ ] PIN entry works for pairing
- [ ] Pairing state persists across page reloads
- [ ] Linked accounts are associated with bay
- [ ] Pairing expires after set time

---

### Increment 8: Cleanup & Migration
**Goal:** Remove deprecated session/auth code, finalize state model

**Changes:**
1. Remove session store (or mark as deprecated)
2. Update all components to use new stores
3. Remove unused routes (`/start`, `/session-saved`)
4. Update API routes if needed
5. Final state model validation

**Files to Touch:**
- `store/sessionStore.ts` (remove or deprecate)
- `store/authStore.ts` (simplify or remove)
- All components using old stores (update)
- `app/start/page.tsx` (remove)
- `app/session-saved/page.tsx` (remove if unused)

**Test Checklist:**
- [ ] No references to deprecated session store
- [ ] All auth flows use linked accounts store
- [ ] No broken routes
- [ ] State model is consistent
- [ ] No console errors

---

## 7. Files Expected to Touch in Prompt 2 (Mode Tile Routing)

### New Files:
1. `app/mode/[mode]/page.tsx` - Dynamic route for mode selection
2. `app/mode/[mode]/layout.tsx` - Optional shared layout for mode routes

### Modified Files:
1. `components/TileCard.tsx` - Add onClick prop and cursor-pointer
2. `components/TileGrid.tsx` - Add click handlers and routing logic
3. `app/play/page.tsx` - Minor update to pass router/onClick to TileGrid

### File Paths (as they exist):
```
C:\cursor-prototypes\sign-in-prototype-optimal\components\TileCard.tsx
C:\cursor-prototypes\sign-in-prototype-optimal\components\TileGrid.tsx
C:\cursor-prototypes\sign-in-prototype-optimal\app\play\page.tsx
C:\cursor-prototypes\sign-in-prototype-optimal\app\mode\[mode]\page.tsx (new)
C:\cursor-prototypes\sign-in-prototype-optimal\app\mode\[mode]\layout.tsx (new, optional)
```

---

## 8. Additional Notes

### 8.1 Constraints
- No new dependencies (use existing: Zustand, Next.js, React)
- Maintain existing UI patterns (RangeLayout, TopNav, etc.)
- Keep backward compatibility during migration

### 8.2 Key Design Decisions
- **No explicit sessions:** Game mode + play config replaces session concept
- **Phone-first auth:** QR code scanning is primary auth method
- **Per-account logout:** Each linked account can be signed out independently
- **Guest-friendly:** Guests are first-class, no aggressive upgrade CTAs
- **Bay pairing:** Accounts link to bay via QR + PIN for persistence

### 8.3 Migration Strategy
- Incremental refactor allows testing at each step
- Keep old stores during migration for fallback
- Remove deprecated code in final increment
- Test thoroughly at each increment boundary

---

## 9. State Model TypeScript Interfaces (Complete)

```typescript
// store/bayStore.ts
export interface BayState {
  bayId: string | null;
  bayName?: string;
  isPaired: boolean;
  pairingCode?: string;
  pairingExpiresAt?: number;
}

// store/linkedAccountsStore.ts
export interface LinkedAccount {
  userId: string;
  email: string;
  displayName: string;
  linkedAt: number;
  isActive: boolean;
  pin?: string; // Hashed in production
}

// store/guestsStore.ts
export interface Guest {
  id: string; // 'guest-{timestamp}'
  name?: string;
  createdAt: number;
  lastPlayAt?: number;
}

// store/gameModeStore.ts
export type GameMode = 'range' | 'target-range' | 'courses' | 'closest-to-pin' | null;

export interface PlayConfig {
  mode: GameMode;
  playerId: string | null; // userId or guestId
  playerType: 'user' | 'guest';
  startedAt: number;
  shots: Shot[];
}

// lib/types.ts (existing, keep)
export interface Shot {
  id: string;
  timestamp: number;
  carryYards: number;
  ballSpeedMph: number;
  launchDeg: number;
}
```

---

**End of Audit**
