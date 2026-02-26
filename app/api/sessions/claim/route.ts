import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function POST(request: Request) {
  const { claimToken, userId } = await request.json();

  if (!claimToken || !userId) {
    return NextResponse.json(
      { error: 'claimToken and userId are required' },
      { status: 400 }
    );
  }

  // Find session by claim token
  const allSessions = sessionStorage.getAll();
  const session = allSessions.find((s) => s.claimToken === claimToken);

  if (!session) {
    return NextResponse.json(
      { error: 'Invalid claim token' },
      { status: 404 }
    );
  }

  // Check if token expired
  if (session.claimExpiresAt && Date.now() > session.claimExpiresAt) {
    return NextResponse.json(
      { error: 'Claim token has expired' },
      { status: 410 }
    );
  }

  // Check if already claimed
  if (session.ownerType === 'user') {
    return NextResponse.json(
      { error: 'Session already claimed' },
      { status: 400 }
    );
  }

  // Claim the session (bind whole session to user)
  const updatedSession = sessionStorage.update(session.id, {
    ownerType: 'user',
    userId,
    claimToken: undefined, // One-time use
    claimExpiresAt: undefined,
  });

  return NextResponse.json({ session: updatedSession });
}
