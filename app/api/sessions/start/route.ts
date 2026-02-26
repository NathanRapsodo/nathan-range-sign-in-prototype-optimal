import { NextResponse } from 'next/server';
import { sessionStorage, generateSessionShots } from '@/lib/storage';
import type { Session } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { userId } = body;

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const claimToken = userId ? undefined : `claim_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  const now = Date.now();
  const claimExpiresAt = userId ? undefined : now + 24 * 60 * 60 * 1000; // 24 hours

  // Generate fake shots for the session
  const shots = generateSessionShots();

  const session: Session = {
    id: sessionId,
    claimToken,
    ownerType: userId ? 'user' : 'guest',
    userId,
    shots,
    startedAt: now,
    claimExpiresAt,
    syncStatus: 'idle',
  };

  sessionStorage.create(session);

  // Verify it was stored
  const stored = sessionStorage.get(sessionId);
  if (!stored) {
    console.error('Failed to store session:', sessionId);
  }

  return NextResponse.json({
    sessionId,
    claimToken,
    claimExpiresAt,
    session,
  });
}
