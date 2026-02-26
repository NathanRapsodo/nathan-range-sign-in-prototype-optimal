import { NextResponse } from 'next/server';
import { claimStorage } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const endedSessionId = searchParams.get('endedSessionId');

    if (!sessionId && !endedSessionId) {
      return NextResponse.json(
        { error: 'sessionId or endedSessionId is required' },
        { status: 400 }
      );
    }

    let claim = null;
    if (sessionId) {
      claim = claimStorage.getBySessionId(sessionId);
    } else if (endedSessionId) {
      claim = claimStorage.getByEndedSessionId(endedSessionId);
    }

    if (!claim) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      email: claim.email,
      claimToken: claim.claimToken,
    });
  } catch (error) {
    console.error('[CLAIM] Error checking claim:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check claim' },
      { status: 500 }
    );
  }
}
