import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function POST(request: Request) {
  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  const session = sessionStorage.get(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  // Check if session is owned by a user
  if (session.ownerType !== 'user') {
    return NextResponse.json(
      { error: 'Only user sessions can be synced' },
      { status: 400 }
    );
  }

  // Simulate async sync: 80% success, 20% failure
  // Update sync status immediately
  sessionStorage.update(sessionId, {
    syncStatus: 'syncing',
  });

  // Simulate network delay (1500ms)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const success = Math.random() > 0.2;
  const updatedSession = sessionStorage.update(sessionId, {
    syncStatus: success ? 'synced' : 'failed',
    syncedAt: success ? Date.now() : undefined,
  });

  return NextResponse.json({ session: updatedSession });
}
