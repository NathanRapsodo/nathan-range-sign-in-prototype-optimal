import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  const session = sessionStorage.get(id);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  // Check if already claimed
  if (session.ownerType === 'user') {
    return NextResponse.json(
      { error: 'Session already claimed' },
      { status: 400 }
    );
  }

  // Check if session has ended
  if (!session.endsAt) {
    return NextResponse.json(
      { error: 'Session must be ended before claiming' },
      { status: 400 }
    );
  }

  // Claim the ended session (bind whole session to user)
  const updatedSession = sessionStorage.update(id, {
    ownerType: 'user',
    userId,
    claimToken: undefined,
    claimExpiresAt: undefined,
  });

  return NextResponse.json({ session: updatedSession });
}
