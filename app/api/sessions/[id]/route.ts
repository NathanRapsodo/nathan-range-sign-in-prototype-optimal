import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = sessionStorage.get(id);

  if (!session) {
    // Debug: log all session IDs
    const allSessions = sessionStorage.getAll();
    console.error(`Session ${id} not found. Available sessions:`, allSessions.map(s => s.id));
    return NextResponse.json(
      { error: 'Session not found', requestedId: id },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const updates = await request.json();
  const session = sessionStorage.update(id, updates);

  if (!session) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ session });
}
