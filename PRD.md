# Rapsodo Golf Range Bay Sign-In & Account Management System - Product Requirements Document

## Objectives

### Primary Objectives

1. Enable golfers to quickly link their Rapsodo Golf accounts to range bay devices via mobile phone pairing
2. Support seamless multi-player game setup with visual slot-based player selection
3. Provide guest play options for users who don't have accounts or prefer not to sign in
4. Implement automatic idle timeout and sign-out for privacy and security on shared kiosk devices
5. Create a unified account management interface for managing multiple linked accounts and guests

### Secondary Objectives

1. Increase account creation conversion through streamlined 4-step wizard
2. Reduce friction in game mode setup by supporting multiple player addition methods
3. Improve user experience with clear visual feedback and progressive disclosure
4. Support account verification workflows with visual indicators
5. Enable guest-to-account conversion through strategic upsell opportunities

## Actors

| Actor Name | Actor behavior up to the requirements (Optional) |
|------------|---------------------------------------------------|
| **Golfer (Account Holder)** | Has existing Rapsodo Golf account. Wants to link account to bay device for personalized game experience and data tracking. May have multiple accounts linked to same bay. |
| **Golfer (Guest)** | No account or prefers not to sign in. Wants quick access to play games without account creation. May convert to account holder after play session. |
| **Range Operator** | Manages range facility. Needs kiosk devices to automatically sign out users for privacy and security. Requires system to handle idle timeouts gracefully. |
| **Multi-Player Group** | Group of golfers playing together. Needs to quickly add multiple players (mix of account holders and guests) to game setup. Requires visual slot system for easy player management. |

## Requirements

| Scope | Requirement | User Story | Priority | Notes |
|-------|-------------|------------|----------|-------|
| **APP** | **Bay Pairing System** | As a golfer, I want to link my account to the bay device via QR code or PIN, so I can quickly sign in without typing credentials on the kiosk. | **HIGH** | • QR code widget with collapsed/expanded states and PIN code display • Generate unique pairing tokens per bay that expire after 90 seconds and auto-refresh • Each bay maintains its own pairing session with single-use tokens validated on mobile device • Bay device displays QR code containing pairing URL with bay ID and token • Mobile device scans QR or enters PIN, validates token with backend, and establishes secure pairing channel • On successful validation, account is linked to bay and appears in active accounts list • Support for both native app and web browser pairing flows with pairing confirmation on mobile device |
| **APP** | **Account Management** | As a golfer, I want to sign in, create accounts, and manage multiple linked accounts on the bay, so I can personalize my experience and play with groups. | **HIGH** | • Account management popover, sign-in modal, 4-step account creation wizard, sign-out confirmation modals, verification status indicators • Support unlimited linked accounts per bay with separate game data and session state per account • Account names formatted as "First Name + Last Initial" for consistency across UI • Email addresses masked in UI for privacy on shared screens • Account verification status tracked and displayed with visual indicators • Game data automatically saved to account on sign-out with confirmation messaging • Users access account management via top navigation icon • Sign-in flow supports email/password authentication • Account creation wizard guides through identity, password, consent, and confirmation steps |
| **APP** | **Guest Play System** | As a guest golfer, I want to play without creating an account, with the option to convert to an account later to save my data. | **HIGH** | • Guest creation modal with name input and color selection (8 color options) • Guest profiles persist during active session and can be reused across game setups • Guest game data is not persisted unless converted to account • On guest sign-out, system presents upsell modal offering account creation to preserve data • If guest declines conversion, all guest data is lost with clear communication • Guest creation accessible from account management or game setup • Guest profiles appear in "In the Clubhouse" section and available player lists • When guest creates account, existing game data is migrated to new account |
| **APP** | **Multi-Player Game Setup** | As a golfer, I want to easily add multiple players (linked accounts, guests, or new accounts) to game setup using a visual slot system. | **HIGH** | • Player slot grid supporting up to 8 players per game with slot menu system • Each slot can contain one player (linked account, guest, or new account/guest) • Players can be added from multiple sources: already-linked accounts, existing guest profiles, new account creation, or new guest creation • New players automatically assigned to next available slot with duplicate prevention • Game mode setup screen displays 8-slot grid with empty slots showing "+" button • Slot menu provides options: add linked account, add guest profile, create account, or create guest • Selected players fill slots automatically with player removal capability • Setup screen validates minimum player requirements before allowing game start |
| **APP** | **Idle Timeout & Privacy** | As a range operator, I want the system to automatically sign out users after inactivity to protect privacy on shared kiosk devices. | **HIGH** | • System tracks user activity including clicks, touches, keyboard input, and modal interactions • After 5 minutes of inactivity, warning modal appears explaining privacy reasons and consequences • Modal shows countdown timer with "I'm still here" button to reset timer • If inactivity continues to 10 minutes total, system automatically signs out all linked accounts, removes all guests, and returns to home screen • All activity resets timer to zero • Idle timer runs continuously in background with activity detection monitoring all user interactions • When 5-minute threshold reached, modal appears with privacy explanation and countdown • User interaction with "I'm still here" resets timer and closes modal • If no interaction, countdown continues to zero and automatic sign-out executes, clearing all accounts and guests |
| **APP** | **Account Display & Navigation** | As a golfer, I want to see all active accounts and guests, manage them centrally, and navigate game modes easily. | **HIGH** | • "In the Clubhouse" section shows all currently linked accounts and active guest profiles in real-time • Account management popover provides centralized access to all account operations (add, remove, view details) • Game mode selection displays available modes (Range, Target Range, Courses, Closest to Pin) • Setup lobby allows player configuration before game start • "In the Clubhouse" updates automatically as accounts are added or removed • Account icon in top navigation opens management popover with sections for linked accounts and guests • Game mode tiles navigate to respective setup screens • Setup lobby shows player slots and mode-specific settings with back navigation returning to play screen |

## Out of Scope

| Scope | Requirement | Explanation | Status |
|-------|-------------|-------------|--------|
| **APP** | **Multi-Bay Management** | Range-wide account management and bay switching capabilities across multiple bay devices. | **WAITING** |
| **APP** | **Offline Mode** | Support offline play with data sync when connection restored. | **WAITING** |
| **HARDWARE** | **Bay Device Integration** | Integration with actual range bay hardware, sensors, and display systems. | **WAITING** |
| **ALGO** | **Game Data Analytics** | Real-time shot tracking, statistics calculation, and performance analytics. | **WAITING** |
| **APP** | **Social Features** | Friend lists, sharing, and social gameplay features. | **WAITING** |
| **APP** | **Payment Integration** | Payment processing for premium features or range access. | **WAITING** |

## Expected High-level Mock-ups for UX/UI Team

1. **Play Screen (Main Attract)**
   - Top navigation with account icon and exit button
   - "In the Clubhouse" section showing linked accounts and guests
   - Game mode tile grid (4 tiles: Range, Target Range, Courses, Closest to Pin)
   - QR code widget in top-right corner (collapsed and expanded states)
   - Welcome message and branding

2. **Account Management Popover**
   - Header with "Linked Accounts" and "Guests" sections
   - Account cards showing name, masked email, verification status, sign-out button
   - Guest cards showing name, color avatar, sign-out button
   - "Add account" button with inline menu (Scan QR, Sign in manually, Add guest)

3. **Game Mode Setup Screen**
   - 8-slot player grid (2x4 or 4x2 layout)
   - Each slot shows player avatar, name, and type indicator
   - Empty slots show "+" button with menu options
   - Mode-specific settings panel
   - "Continue" and "Back" buttons

4. **QR Code Widget States**
   - Collapsed: Small QR code with pulsing border, PIN code, and "Tap to expand" text
   - Expanded: Large QR code, PIN code, instructions, close button
   - Backdrop overlay when expanded

5. **Account Creation Wizard (4 Steps)**
   - Step 1: Name and email form
   - Step 2: Password creation with strength indicator
   - Step 3: Terms & conditions checkbox
   - Step 4: Success screen with "Enjoy your game" message and app download promo

6. **Idle Timeout Modal**
   - Privacy explanation header
   - Info box with bullet points explaining consequences
   - Countdown timer (when < 5 minutes remaining)
   - "I'm still here" button

7. **Sign-Out Confirmation Modals**
   - Linked account: Confirmation with data saving reassurance
   - Guest: Upsell to create account with "Create account" and "Sign out anyway" options

## User Flows

### Flow 1: Link Account via QR Code (App Installed)
1. Golfer arrives at bay device
2. Sees QR code widget on play screen
3. Taps QR code to expand
4. Opens Rapsodo Golf app on phone
5. Scans QR code with app
6. App validates token and displays pairing confirmation
7. Golfer confirms pairing
8. App broadcasts pairing success to bay device
9. Bay device receives broadcast and links account
10. Account appears in "In the Clubhouse" section
11. Toast notification confirms successful linking

### Flow 2: Link Account via QR Code (No App)
1. Golfer arrives at bay device
2. Sees QR code widget on play screen
3. Taps QR code to expand
4. Opens phone camera and scans QR code
5. Browser opens pairing URL
6. Golfer sees sign-in/create account options
7. Golfer signs in with existing account OR creates new account via 4-step wizard
8. On account creation/sign-in, system broadcasts pairing success
9. Bay device receives broadcast and links account
10. Account appears in "In the Clubhouse" section
11. Success screen shows "Enjoy your game" message

### Flow 3: Create Account from Bay Device
1. Golfer taps account icon in top navigation
2. Account popover opens
3. Golfer taps "Add account" → "Sign in manually"
4. Sign-in modal opens
5. Golfer taps "Create account" tab
6. Completes Step 1: Enters first name, last name, email
7. Completes Step 2: Creates and confirms password
8. Completes Step 3: Accepts terms & conditions
9. Sees Step 4: Success screen with app download promo
10. Account is automatically linked to bay
11. Account appears in "In the Clubhouse" section

### Flow 4: Add Guest Player
1. Golfer taps account icon in top navigation
2. Account popover opens
3. Golfer taps "Add account" → "Add guest"
4. Guest creation modal opens
5. Golfer enters guest name
6. Golfer selects color from 8 options
7. Golfer taps "Add guest"
8. Guest appears in "In the Clubhouse" section
9. Guest profile is available for future game sessions

### Flow 5: Set Up Multi-Player Game
1. Golfer navigates to play screen
2. Sees game mode tiles
3. Taps desired game mode (e.g., "Range")
4. Game mode setup screen opens
5. Sees 8 empty player slots
6. Taps "+" on first slot
7. Selects "Add linked account" → Chooses from list
8. Account fills slot 1
9. Taps "+" on second slot
10. Selects "Add guest profile" → Chooses existing guest
11. Guest fills slot 2
12. Taps "+" on third slot
13. Selects "Create account" → Completes 4-step wizard
14. New account fills slot 3
15. Taps "+" on fourth slot
16. Selects "Add guest" → Creates new guest
17. New guest fills slot 4
18. Taps "Continue" to start game

### Flow 6: Idle Timeout and Sign-Out
1. Golfer is using bay device
2. No activity for 5 minutes
3. Idle warning modal appears
4. Modal explains privacy reasons and consequences
5. Shows countdown timer (5 minutes remaining)
6. Golfer taps "I'm still here" OR continues inactivity
7. If "I'm still here": Timer resets, modal closes
8. If inactivity continues: After 10 minutes total, automatic sign-out occurs
9. All linked accounts signed out
10. All guests removed
11. User returned to home/splash screen

### Flow 7: Guest Conversion to Account
1. Guest is playing on bay device
2. Guest taps account icon → Sees guest in popover
3. Guest taps "Sign out" on guest profile
4. Upsell modal appears: "Create account to save your data"
5. Guest taps "Create account"
6. Completes 4-step account creation wizard
7. Account is created but NOT automatically linked (guest was signing out)
8. Guest data is preserved in new account
9. Guest profile removed from bay
10. Success message confirms account creation

## Success Metrics & Criteria

| Goal | Metric & Criteria |
|------|-------------------|
| **Reduce Account Linking Friction** | 80% of users successfully link account via QR code on first attempt. Average time to link account < 30 seconds. |
| **Increase Account Creation Conversion** | 60% of guests who see upsell modal convert to account creation. 4-step wizard completion rate > 85%. |
| **Improve Multi-Player Setup Efficiency** | Average time to set up 4-player game < 2 minutes. 90% of users successfully add players using slot system. |
| **Ensure Privacy Compliance** | 100% of idle sessions automatically sign out after 10 minutes. Zero instances of account data visible after timeout. |
| **User Satisfaction** | User satisfaction score > 4.5/5 for account linking experience. < 10% of users require support for account management. |
| **System Reliability** | QR code pairing success rate > 95%. Token refresh occurs seamlessly without user interruption. |
| **Guest Engagement** | 40% of guest players return for second session. Average guest session duration > 15 minutes. |

## Reporting Needs

| Goal | Description |
|------|-------------|
| **Account Linking Analytics** | Track QR code scans, PIN entries, successful pairings, failed pairings, pairing method distribution (app vs web), average pairing time |
| **Account Creation Funnel** | Track account creation starts, step completion rates, drop-off points, completion time, conversion from guest to account |
| **Game Setup Metrics** | Track average players per game, player source distribution (linked account vs guest vs new), setup time, slot utilization |
| **Idle Timeout Events** | Track idle warnings shown, "I'm still here" clicks, automatic sign-outs, average session duration, timeout frequency |
| **User Engagement** | Track daily active users, accounts per bay, guest vs account holder ratio, return user rate, session frequency |
| **Error Tracking** | Track pairing failures, token expiration errors, network errors, UI errors, support ticket volume by issue type |

## Test Cases

| # | Description | Preconditions | Steps to Execute |
|---|-------------|---------------|------------------|
| 1 | **Link Account via QR Code** | Bay device on play screen, QR code visible, mobile device with app or browser | 1. Scan QR code with mobile device 2. Sign in or create account 3. Verify account appears in "In the Clubhouse" 4. Verify successful pairing notification |
| 2 | **Create Account from Bay Device** | Bay device on play screen | 1. Open account management 2. Select "Create account" 3. Complete 4-step wizard 4. Verify account is linked and appears in "In the Clubhouse" |
| 3 | **Add Guest and Convert to Account** | Bay device on play screen | 1. Create guest profile 2. Sign out guest 3. Select "Create account" from upsell 4. Complete account creation 5. Verify guest data preserved in new account |
| 4 | **Set Up Multi-Player Game** | Bay device on play screen, multiple accounts/guests available | 1. Select game mode 2. Add players to slots (mix of linked accounts, guests, new accounts) 3. Verify all players appear correctly 4. Start game |
| 5 | **Idle Timeout and Sign-Out** | Bay device with active accounts, no user activity | 1. Wait 5 minutes for warning modal 2. Verify privacy explanation and countdown 3. Continue inactivity to 10 minutes 4. Verify automatic sign-out of all accounts and guests |
| 6 | **Account Management** | Bay device with multiple linked accounts | 1. Open account popover 2. Verify all accounts displayed with masked emails 3. Sign out one account 4. Verify confirmation and data saving message 5. Verify account removed from display |

## Research

### User Research Findings
- Golfers prefer QR code scanning over manual PIN entry (85% preference in usability testing)
- Multi-player groups average 3-4 players per session
- Guest players convert to accounts at 40% rate when presented with upsell
- Average account linking time: 25 seconds via QR, 45 seconds via manual sign-in
- Idle timeout of 10 minutes balances privacy with user experience (user testing feedback)

### Technical Research
- QR code generation libraries available for client-side and server-side implementation
- WebSocket/SSE required for real-time pairing communication between mobile devices and bay devices
- State management solutions needed for kiosk device performance and reliability
- Touch-optimized UI frameworks suitable for range bay displays

### Competitive Analysis
- Similar range systems use PIN-only pairing (slower, higher friction)
- Most systems don't support guest play (require account creation)
- Idle timeout implementations vary (5-15 minute ranges)
- Multi-player setup typically requires sequential account linking (slower than slot-based system)

## Algo Additional Inputs

*No algorithm requirements for this feature set. All logic is UI/UX focused with standard authentication and state management patterns.*

## Sales/Marketing/Support Feasibility Analysis

### Sales
- **Impact**: High. Streamlined account linking reduces barrier to entry for new users. Multi-player support enables group sales opportunities.
- **Training Needs**: Sales team needs training on QR code pairing process, guest play options, and account creation flow.
- **Demo Requirements**: Live demo capability required for sales presentations and range operator demonstrations.

### Marketing
- **Messaging Opportunities**: "Link in seconds with QR code", "Play with friends - no account needed", "Your data, your privacy - automatic sign-out"
- **Content Needs**: Video tutorials for QR code pairing, account creation walkthrough, multi-player setup guide
- **Campaign Ideas**: "Quick Link Challenge" - fastest account linking, "Bring a Friend" - guest play promotion

### Support
- **Common Issues Anticipated**: QR code not scanning, token expiration, account not linking, guest data loss questions
- **Support Materials Needed**: Troubleshooting guide for QR pairing, account creation FAQ, idle timeout explanation
- **Escalation Paths**: Technical issues with pairing → Engineering. Account creation failures → Account team. Privacy concerns → Legal/Compliance

## Assumptions & Constraints & Dependencies & Risks

### Assumptions

1. **User Behavior**
   - Users have smartphones with cameras capable of QR code scanning
   - Users are comfortable with QR code technology
   - Users understand the concept of "linking" an account to a device
   - Multi-player groups will have mix of account holders and guests

2. **Technical**
   - Bay devices have stable internet connectivity
   - Mobile devices have internet connectivity for web-based pairing
   - Real-time communication infrastructure (WebSocket/SSE) available for pairing
   - QR code generation libraries are performant on bay device hardware

3. **Business**
   - Range operators want automatic sign-out for privacy compliance
   - Account creation conversion is important business metric
   - Guest play is acceptable business model (may convert to accounts)

### Constraints

1. **Technical Constraints**
   - Real backend authentication and API integration required
   - Database persistence required for accounts, game data, and session state
   - Mobile camera API integration required for QR code scanning
   - Token expiration timing (90 seconds) may need adjustment based on user testing

2. **UI/UX Constraints**
   - Touch-optimized for kiosk displays (minimum 10-inch tablets)
   - Must work in landscape orientation
   - Must support both touch and mouse input
   - Color contrast must meet WCAG AA standards

3. **Business Constraints**
   - Idle timeout must balance privacy with user experience (10 minutes chosen)
   - Guest data loss is acceptable trade-off for privacy (documented in UI)
   - Account creation wizard must be completable in < 2 minutes

### Dependencies

1. **External Services**
   - Authentication service (for production)
   - Account management API (for production)
   - QR code generation service (or client-side library)
   - Push notification service (for production account verification)

2. **Internal Systems**
   - Bay device hardware and firmware
   - Range network infrastructure
   - Game mode systems (for player slot integration)
   - Analytics and reporting systems

3. **Third-Party Libraries**
   - QR code generation library (client or server-side)
   - State management solution for kiosk devices
   - UI framework suitable for touch interfaces
   - Styling framework for responsive design

### Risks

1. **Technical Risks**
   - **QR Code Scanning Failures**: Low light, damaged QR codes, camera issues. *Mitigation*: Provide PIN code fallback, clear QR code display instructions.
   - **Token Expiration During Pairing**: User scans QR but takes > 90 seconds to complete. *Mitigation*: Auto-refresh tokens, extend expiration time if needed.
   - **Network Connectivity Issues**: Bay device or phone loses connection during pairing. *Mitigation*: Clear error messages, retry mechanisms, offline mode consideration.

2. **User Experience Risks**
   - **Idle Timeout Confusion**: Users don't understand why they're being signed out. *Mitigation*: Clear modal copy explaining privacy reasons, prominent "I'm still here" button.
   - **Guest Data Loss Complaints**: Users lose guest game data and are upset. *Mitigation*: Clear warnings in UI, upsell to account creation, documentation of data loss.
   - **Multi-Player Setup Complexity**: Users find 8-slot system confusing. *Mitigation*: User testing, clear visual hierarchy, help text, tutorial mode.

3. **Business Risks**
   - **Low Account Creation Conversion**: Guests don't convert to accounts. *Mitigation*: A/B test upsell messaging, optimize conversion funnel, consider incentives.
   - **Privacy Compliance Issues**: Idle timeout doesn't meet regulatory requirements. *Mitigation*: Legal review, compliance testing, adjustable timeout settings.
   - **Support Burden**: High volume of pairing-related support tickets. *Mitigation*: Comprehensive documentation, video tutorials, in-app help, troubleshooting guides.

4. **Security Risks**
   - **Token Security**: Pairing tokens could be intercepted or reused. *Mitigation*: Short expiration times, single-use tokens (for production), HTTPS only.
   - **Account Hijacking**: Malicious user links someone else's account. *Mitigation*: Account verification, confirmation on mobile device, audit logging.
   - **Session Management**: Multiple accounts on shared device could expose data. *Mitigation*: Automatic sign-out, clear account separation, no data persistence on device.

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Owner**: Product Team  
**Status**: Draft for Review
