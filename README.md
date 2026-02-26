# Rapsodo Golf Sign-In Prototype

A clickable UI prototype recreating the Rapsodo Golf range interface with a fullscreen, touchscreen-optimized design.

## Features

- **Splash Screen**: Fullscreen welcome screen with golf course aesthetic
- **Start Screen**: Guest vs Sign-in choice with range styling
- **Main UI**: Recreation of the home screen with PLAY/SESSIONS tabs and 4 game mode tiles
- **End Screen**: Session end confirmation with return to start

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Sign-In Layout**: 16:9 centered screen with bezel effect
- **Touch-Optimized**: Large touch targets and clear visual hierarchy

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Routes

- `/` - Splash screen (click anywhere to continue)
- `/start` - Start session choice (Guest or Sign In)
- `/play` - Main UI with game mode tiles (exit icon navigates to /end)
- `/end` - Session ended screen (Back to Start returns to /)

## Project Structure

```
rapsodo-range-prototype/
├── app/
│   ├── page.tsx          # Splash screen
│   ├── start/
│   │   └── page.tsx      # Start choice screen
│   ├── play/
│   │   └── page.tsx      # Main UI
│   ├── end/
│   │   └── page.tsx      # End session screen
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── RangeLayout.tsx   # Shared range frame with bezel
│   ├── TopNav.tsx        # Header with tabs and exit icon
│   ├── TileGrid.tsx      # Grid of 4 game mode tiles
│   └── TileCard.tsx      # Individual tile component
└── README.md
```

## Design Notes

- **Sign-In Feel**: 16:9 aspect ratio screen with dark bezel and shadow effects
- **Typography**: Bold, uppercase headings with strong visual hierarchy
- **Colors**: Light gray panels on dark background, Rapsodo red accents
- **Interactions**: Only navigation buttons are functional (tiles are visual only)
- **Responsive**: Scales down cleanly while maintaining aspect ratio

## Notes

- This is a **UI prototype only** - no backend, authentication, or session tracking
- Tiles are not clickable (visual only)
- Only the exit icon on the main screen and navigation buttons are functional
- Designed for touchscreen range displays
