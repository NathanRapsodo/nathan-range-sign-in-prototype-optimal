import { NextResponse } from 'next/server';
import { userStorage } from '@/lib/storage';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const user = userStorage.getByEmail(email);

  if (!user || user.password !== password) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Check if email is verified
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: 'Please verify your email before signing in. Check your email for a verification code.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ userId: user.id, email: user.email });
}
