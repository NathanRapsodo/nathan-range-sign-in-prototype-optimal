export interface Shot {
  id: string;
  timestamp: number;
  carryYards: number;
  ballSpeedMph: number;
  launchDeg: number;
}

export interface Session {
  id: string;
  ownerType: 'guest' | 'user';
  userId?: string;
  claimToken?: string;
  claimExpiresAt?: number;
  shots: Shot[];
  startedAt: number;
  endsAt?: number;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'failed';
  syncedAt?: number;
}

export interface User {
  id: string;
  email: string;
  password: string; // In production, this would be hashed
  phoneNumber?: string;
  emailVerified: boolean;
}
