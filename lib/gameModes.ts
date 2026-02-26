/**
 * Game mode configuration and utilities
 * Single source of truth for mode IDs and display names
 */

export const SUPPORTED_MODE_IDS = ['range', 'target-range', 'courses', 'closest-to-pin'] as const;

export type ModeId = typeof SUPPORTED_MODE_IDS[number];

export interface GameMode {
  id: ModeId;
  displayName: string;
}

export const GAME_MODES: Record<ModeId, GameMode> = {
  'range': {
    id: 'range',
    displayName: 'Range',
  },
  'target-range': {
    id: 'target-range',
    displayName: 'Target Range',
  },
  'courses': {
    id: 'courses',
    displayName: 'Courses',
  },
  'closest-to-pin': {
    id: 'closest-to-pin',
    displayName: 'Closest to Pin',
  },
};

/**
 * Get display name for a mode ID
 * @param modeId - The mode ID to look up
 * @returns Display name or null if modeId is unknown
 */
export function getModeDisplayName(modeId: string): string | null {
  if (isValidModeId(modeId)) {
    return GAME_MODES[modeId].displayName;
  }
  return null;
}

/**
 * Check if a mode ID is valid
 * @param modeId - The mode ID to validate
 * @returns True if modeId is valid
 */
export function isValidModeId(modeId: string): modeId is ModeId {
  return SUPPORTED_MODE_IDS.includes(modeId as ModeId);
}
