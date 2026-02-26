# Rapsodo Golf Sign-In Prototype

A comprehensive UI prototype demonstrating the future vision for user sign-in and account management on Rapsodo Golf range devices. This prototype showcases a complete account linking system, guest play options, and seamless game mode setup.

## 🎯 Overview

This prototype explores how golfers can link their accounts to range bay devices, manage multiple players, and seamlessly start games. It demonstrates:

- **Bay Pairing**: QR code + PIN system for linking accounts via mobile devices
- **Account Management**: Sign in, create accounts, and manage linked accounts
- **Guest Play**: Quick play without account creation
- **Player Selection**: Visual slot-based system for multi-player game modes
- **Idle Management**: Automatic timeout and sign-out for kiosk devices

## 🚀 Live Demo

**Deployed Site**: [View on GitHub Pages](https://nathanrapsodo.github.io/nathan-range-sign-in-prototype-optimal/)

## 🛠️ Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Zustand** for state management
- **Tailwind CSS** for styling
- **QR Code Generation** for bay pairing
- **BroadcastChannel API** for cross-tab communication (simulations)

## 📋 Key Features

### Account Linking
- **QR Code Pairing**: Scan QR code on bay to link account from phone
- **PIN Entry**: Alternative method using 6-digit PIN
- **Multiple Accounts**: Support for multiple linked accounts per bay
- **Account Verification**: Visual indicators for verified/unverified accounts

### Account Creation & Sign-In
- **4-Step Account Creation**: Identity → Password → Consent → Success
- **Sign-In Flow**: Email/password authentication with mock accounts
- **Name Formatting**: Displays as "First Name + Last Initial" (e.g., "Nathan A")

### Guest Play
- **Quick Guest Creation**: Name + color selection
- **Guest Profiles**: Reusable guest profiles across sessions
- **Guest Conversion**: Upsell to create account when signing out

### Game Mode Setup
- **8 Player Slots**: Visual slot-based player selection
- **Multiple Sources**: Add linked accounts, guest profiles, or create new
- **Auto-Assignment**: New accounts/guests automatically fill next available slot

### Idle Management
- **5-Minute Warning**: "Still using this bay?" prompt
- **Auto Sign-Out**: Automatic sign-out after 10 minutes of inactivity
- **Activity Tracking**: Resets on any interaction

## 🎮 Exploration Tasks

Complete these tasks to explore all functionality:

### Task 1: Link an Account via QR Code
1. Navigate to `/play` (the main attract screen)
2. Look for the QR code widget in the top-right corner
3. Click/tap the QR code to expand it
4. Click "Simulate scan (App installed)" or "Simulate scan (No app installed)"
5. In the popup window, sign in with a mock account:
   - Email: `nathan@example.com` (or any mock account)
   - Password: `ilovegolf`
6. Observe the account appearing in "In the Clubhouse" section
7. **Bonus**: Try the "No app installed" flow to see the web-based pairing

### Task 2: Create a New Account
1. On `/play`, click the account icon in the top-right (opens Accounts popover)
2. Click "Add account"
3. Select "Sign in" → "Create account" (or use the choice popover)
4. Complete the 4-step account creation:
   - **Step 1**: Enter first name, last name, email
   - **Step 2**: Create password (min 6 characters) and confirm
   - **Step 3**: Accept terms & conditions
   - **Step 4**: See success screen with app download promo
5. Notice the account is automatically linked to the bay

### Task 3: Add a Guest Player
1. Open Accounts popover (account icon top-right)
2. Click "Add account" → "Add guest"
3. Enter a guest name (e.g., "John")
4. Select a color from the 8 color options
5. Click "Add guest"
6. See the guest appear in "In the Clubhouse"

### Task 4: Set Up a Multi-Player Game
1. On `/play`, click any game mode tile (e.g., "Range")
2. You'll see the game mode setup lobby with 8 player slots
3. Click the "+" button on an empty slot
4. Try different options:
   - **Add linked account**: Select from already linked accounts
   - **Add guest profile**: Select from existing guest profiles
   - **Sign in**: Sign in with a mock account (auto-fills slot)
   - **Create account**: Create new account (auto-fills next empty slot)
   - **Add guest**: Create new guest (auto-fills next empty slot)
5. Fill multiple slots with different player types
6. Notice the visual slot cards showing player avatars and names
7. Click "Continue" when ready

### Task 5: Explore Account Management
1. Open Accounts popover
2. For **linked accounts**:
   - See account name, email (masked), verification status
   - Click "Sign out" → Confirm → See confirmation toast
3. For **guests**:
   - Click "Sign out" → See upsell modal offering account creation
   - Try both "Create account" and "Sign out anyway" options
4. Notice the "In the Clubhouse" section updates in real-time

### Task 6: Test Idle Timeout (Demo Mode)
1. On any kiosk screen (`/play` or game mode setup)
2. Look for the small "Idle" button in the bottom-right corner
3. Click it to instantly trigger the idle warning modal
4. Try both actions:
   - "I'm still here" → Resets the timer
   - "Sign out" → Signs out all accounts and returns to splash
5. Let the countdown run to see automatic sign-out

### Task 7: Test Web-Based Account Creation
1. On `/play`, expand the QR code widget
2. Click "Simulate scan (No app installed)"
3. In the popup, click the "Create account" tab
4. Complete the 4-step wizard (notice no demo account dropdown)
5. See the success screen with "Enjoy your game" message
6. Notice the account is automatically linked to the bay

### Task 8: Explore Name Formatting
1. Create accounts with full names (e.g., "Nathan Adams", "Sam Walters")
2. Notice they display as "Nathan A", "Sam W" throughout the UI
3. Check player slots, account popover, and "In the Clubhouse" section
4. Single names (like "Nathan") display unchanged

### Task 9: Test Sign-Out Flows
1. Link multiple accounts and add some guests
2. Open Accounts popover
3. Sign out a **linked account**:
   - See confirmation modal explaining data will be saved
   - Confirm → See "Good game" toast
4. Sign out a **guest**:
   - See upsell modal
   - Choose "Create account" → Complete flow → Account created but NOT linked (signs out)
   - Or choose "Sign out anyway" → Guest removed

### Task 10: Complete a Full Game Flow
1. Start at `/play` (splash screen)
2. Link 2-3 accounts via QR simulation
3. Add 1-2 guests
4. Click a game mode tile
5. Set up 4-6 players using the slot system
6. Click "Continue" to start the game
7. Click "Simulate game play"
8. See "Game Complete" screen with stats
9. Click "Back to home"
10. Notice all accounts still linked in "In the Clubhouse"

## 🗺️ Key Routes

- `/` - Splash screen (idle timeout returns here)
- `/play` - Main attract screen with game mode tiles and QR pairing
- `/mode/[modeId]/setup` - Game mode lobby with player slot selection
- `/mode/[modeId]/play` - Active game screen
- `/pair` - Phone-side pairing confirmation (simulation)
- `/sim/app` - App-based pairing simulation
- `/sim/web` - Web-based pairing simulation

## 🎨 Design Principles

- **Touch-Optimized**: Large touch targets, clear visual hierarchy
- **Kiosk-First**: Designed for range bay tablet displays
- **Progressive Disclosure**: Information revealed as needed
- **Visual Feedback**: Clear states, animations, and transitions
- **Accessibility**: High contrast, readable fonts, clear labels

## 📝 Mock Data

### Mock Accounts (for testing)
All use password: `ilovegolf`
- Nathan Adams (`nathan@example.com`)
- Sam Walters (`sam@example.com`)
- Eliza Smith (`eliza@example.com`)
- Ozge Osman (`ozge@example.com`)
- Jeff Freeman (`jeff@example.com`)
- Brian Krump (`brian@example.com`)

## 🔧 Development

### Local Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Test production build locally
npm run build
npx serve out
```

### Project Structure

```
sign-in-prototype-optimal/
├── app/
│   ├── play/              # Main attract screen
│   ├── mode/[modeId]/     # Game mode flows
│   ├── pair/              # Phone pairing page
│   └── sim/               # Simulation pages
├── components/
│   ├── BayPairingWidget.tsx    # QR code pairing widget
│   ├── LinkedAccountsPopover.tsx # Account management
│   ├── CreateAccountModal.tsx   # 4-step account creation
│   ├── PlayerSlotGrid.tsx       # Player selection UI
│   └── ...
├── store/
│   ├── linkedAccountsStore.ts   # Account state
│   ├── gameModeStore.ts         # Game/player state
│   ├── bayStore.ts              # Bay pairing state
│   └── ...
└── lib/
    ├── nameFormatting.ts        # Name display utilities
    ├── mockAccounts.ts          # Test accounts
    └── ...
```

## 🚨 Important Notes

- **Prototype Only**: No real authentication, backend, or data persistence
- **Client-Side Only**: All state is in-memory (refreshes on page reload)
- **Simulation Mode**: Phone pairing uses BroadcastChannel for demo purposes
- **Idle Demo Button**: Only visible in development mode (bottom-right corner)

## 📚 Additional Documentation

- See `DEPLOYMENT.md` for GitHub Pages deployment instructions
- See `REFACTOR_AUDIT.md` for technical architecture details

## 🤝 Contributing

This is a prototype for stakeholder review and feedback. For questions or suggestions, please reach out to the development team.

---

**Built with ❤️ for Rapsodo Golf**
