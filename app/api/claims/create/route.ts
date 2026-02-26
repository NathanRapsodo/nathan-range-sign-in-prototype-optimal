import { NextResponse } from 'next/server';
import { claimStorage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, origin, endedSessionId, sessionId, overwrite } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate origin context
    if (origin === 'START') {
      // For START origin, claim is less relevant but we'll still allow it
      // In a real implementation, you might want to restrict this
    }

    // Check for existing claim for this session
    let existingClaim = null;
    if (sessionId) {
      existingClaim = claimStorage.getBySessionId(sessionId);
    } else if (endedSessionId) {
      existingClaim = claimStorage.getByEndedSessionId(endedSessionId);
    }

    // If claim exists and overwrite is not explicitly requested, return error
    if (existingClaim && !overwrite) {
      return NextResponse.json(
        { 
          error: 'A claim already exists for this session',
          existingEmail: existingClaim.email,
        },
        { status: 409 }
      );
    }

    // Delete existing claim if overwriting
    if (existingClaim && overwrite) {
      if (sessionId) {
        claimStorage.deleteBySessionId(sessionId);
      } else if (endedSessionId) {
        claimStorage.deleteByEndedSessionId(endedSessionId);
      }
    }

    // Create provisional claim
    const claim = claimStorage.create({
      email: email.toLowerCase(),
      origin: origin || 'START',
      endedSessionId: endedSessionId || undefined,
      sessionId: sessionId || undefined,
    });

    // In production, send email with claim link here
    // For prototype, log the claim token
    console.log(`[CLAIM] Provisional claim created for ${email}:`, {
      claimToken: claim.claimToken,
      expiresAt: new Date(claim.expiresAt).toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Email sent',
      // In development, return claim token for testing
      claimToken: process.env.NODE_ENV === 'development' ? claim.claimToken : undefined,
    });
  } catch (error) {
    console.error('[CLAIM] Error creating claim:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create claim' },
      { status: 500 }
    );
  }
}
