// Module-level in-memory storage for mock API
import type { Session, User, Shot } from './types';

// Provisional claim type
export interface ProvisionalClaim {
  claimToken: string;
  email: string;
  origin: string;
  endedSessionId?: string;
  sessionId?: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory storage - using global to persist across hot reloads in dev
declare global {
  var __rapsodo_storage__: {
    sessions: Map<string, Session>;
    users: Map<string, User>;
    usersByEmail: Map<string, User>;
    emailOtpCodes: Map<string, { code: string; expiresAt: number }>; // email -> { code, expiresAt }
    claims: Map<string, ProvisionalClaim>; // claimToken -> ProvisionalClaim
  } | undefined;
}

// Initialize storage, reusing existing if available (for hot reload persistence)
const getStorage = () => {
  if (!global.__rapsodo_storage__) {
    global.__rapsodo_storage__ = {
      sessions: new Map(),
      users: new Map(),
      usersByEmail: new Map(),
      emailOtpCodes: new Map(),
      claims: new Map(),
    };
  }
  return global.__rapsodo_storage__;
};

const storage = getStorage();
const sessions = storage.sessions;
const users = storage.users;
const usersByEmail = storage.usersByEmail;
const emailOtpCodes = storage.emailOtpCodes;
const claims = storage.claims;

// Seed test users for demo
const seedUsers: User[] = [
  { id: 'user_test1', email: 'test@example.com', password: 'password123', emailVerified: true },
  { id: 'user_test2', email: 'demo@rapsodo.com', password: 'demo123', emailVerified: true },
];

// Initialize seed users
seedUsers.forEach((user) => {
  users.set(user.id, user);
  usersByEmail.set(user.email.toLowerCase(), user);
});

// Helper to generate random shot data
export function generateRandomShot(): Shot {
  return {
    id: `shot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    carryYards: Math.floor(Math.random() * 200) + 150, // 150-350 yards
    ballSpeedMph: Math.floor(Math.random() * 30) + 140, // 140-170 mph
    launchDeg: Math.floor(Math.random() * 15) + 8, // 8-23 degrees
  };
}

// Generate multiple shots for a session (25-60 shots)
export function generateSessionShots(count?: number): Shot[] {
  const shotCount = count || Math.floor(Math.random() * 36) + 25; // 25-60 shots
  const shots: Shot[] = [];
  const baseTime = Date.now() - shotCount * 30000; // Spread over time
  
  for (let i = 0; i < shotCount; i++) {
    shots.push({
      ...generateRandomShot(),
      timestamp: baseTime + i * 30000, // 30 seconds between shots
    });
  }
  
  return shots;
}

// Session storage
export const sessionStorage = {
  create: (session: Session): void => {
    sessions.set(session.id, session);
  },
  get: (id: string): Session | undefined => {
    return sessions.get(id);
  },
  update: (id: string, updates: Partial<Session>): Session | undefined => {
    const session = sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates };
    sessions.set(id, updated);
    return updated;
  },
  getAll: (): Session[] => {
    return Array.from(sessions.values());
  },
  clear: (): void => {
    sessions.clear();
  },
};

// User storage
export const userStorage = {
  create: (user: User): void => {
    users.set(user.id, user);
    usersByEmail.set(user.email.toLowerCase(), user);
  },
  get: (id: string): User | undefined => {
    return users.get(id);
  },
  getByEmail: (email: string): User | undefined => {
    return usersByEmail.get(email.toLowerCase());
  },
  update: (id: string, updates: Partial<User>): User | undefined => {
    const user = users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    users.set(id, updated);
    usersByEmail.set(user.email.toLowerCase(), updated);
    return updated;
  },
  clear: (): void => {
    users.clear();
    usersByEmail.clear();
  },
};

// Email OTP storage
export const emailOtpStorage = {
  create: (email: string, code: string, expiresInMs: number = 10 * 60 * 1000): void => {
    emailOtpCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + expiresInMs,
    });
  },
  get: (email: string): { code: string; expiresAt: number } | undefined => {
    const otp = emailOtpCodes.get(email.toLowerCase());
    if (!otp) return undefined;
    // Check if expired
    if (Date.now() > otp.expiresAt) {
      emailOtpCodes.delete(email.toLowerCase());
      return undefined;
    }
    return otp;
  },
  verify: (email: string, code: string): boolean => {
    const otp = emailOtpStorage.get(email);
    if (!otp) return false;
    if (otp.code !== code) return false;
    // Code verified - remove it
    emailOtpCodes.delete(email.toLowerCase());
    return true;
  },
  clear: (email?: string): void => {
    if (email) {
      emailOtpCodes.delete(email.toLowerCase());
    } else {
      emailOtpCodes.clear();
    }
  },
};

// Provisional claim storage
export const claimStorage = {
  create: (data: {
    email: string;
    origin: string;
    endedSessionId?: string;
    sessionId?: string;
  }): ProvisionalClaim => {
    const claimToken = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    const claim: ProvisionalClaim = {
      claimToken,
      email: data.email.toLowerCase(),
      origin: data.origin,
      endedSessionId: data.endedSessionId,
      sessionId: data.sessionId,
      createdAt: now,
      expiresAt,
    };

    claims.set(claimToken, claim);
    return claim;
  },
  get: (claimToken: string): ProvisionalClaim | undefined => {
    const claim = claims.get(claimToken);
    if (!claim) return undefined;
    // Check if expired
    if (Date.now() > claim.expiresAt) {
      claims.delete(claimToken);
      return undefined;
    }
    return claim;
  },
  getByEmail: (email: string): ProvisionalClaim[] => {
    const allClaims = Array.from(claims.values());
    const now = Date.now();
    return allClaims
      .filter((claim) => claim.email.toLowerCase() === email.toLowerCase())
      .filter((claim) => now <= claim.expiresAt);
  },
  getBySessionId: (sessionId: string): ProvisionalClaim | undefined => {
    const allClaims = Array.from(claims.values());
    const now = Date.now();
    return allClaims.find(
      (claim) => claim.sessionId === sessionId && now <= claim.expiresAt
    );
  },
  getByEndedSessionId: (endedSessionId: string): ProvisionalClaim | undefined => {
    const allClaims = Array.from(claims.values());
    const now = Date.now();
    return allClaims.find(
      (claim) => claim.endedSessionId === endedSessionId && now <= claim.expiresAt
    );
  },
  delete: (claimToken: string): void => {
    claims.delete(claimToken);
  },
  deleteBySessionId: (sessionId: string): void => {
    const allClaims = Array.from(claims.values());
    allClaims.forEach((claim) => {
      if (claim.sessionId === sessionId) {
        claims.delete(claim.claimToken);
      }
    });
  },
  deleteByEndedSessionId: (endedSessionId: string): void => {
    const allClaims = Array.from(claims.values());
    allClaims.forEach((claim) => {
      if (claim.endedSessionId === endedSessionId) {
        claims.delete(claim.claimToken);
      }
    });
  },
  clear: (): void => {
    claims.clear();
  },
};

// Clear all storage (for reset demo)
export function clearAllStorage(): void {
  sessionStorage.clear();
  userStorage.clear();
  emailOtpStorage.clear();
  claimStorage.clear();
  // Re-seed test users after clear
  seedUsers.forEach((user) => {
    users.set(user.id, user);
    usersByEmail.set(user.email.toLowerCase(), user);
  });
}

// Ensure seed users are initialized on module load
if (users.size === 0) {
  seedUsers.forEach((user) => {
    users.set(user.id, user);
    usersByEmail.set(user.email.toLowerCase(), user);
  });
}
