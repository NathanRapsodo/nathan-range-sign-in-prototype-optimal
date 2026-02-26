import { NextResponse } from 'next/server';
import { userStorage, emailOtpStorage } from '@/lib/storage';

export async function POST(request: Request) {
  const { email, code } = await request.json();

  if (!email || !code) {
    return NextResponse.json(
      { error: 'Email and code are required' },
      { status: 400 }
    );
  }

  // Prototype-only: Allow default OTP "111111" to verify any account
  const isPrototypeDefaultCode = code === '111111';
  
  // Verify OTP code
  let isValid = false;
  if (isPrototypeDefaultCode) {
    // For prototype, accept "111111" as valid for any email
    isValid = true;
  } else {
    isValid = emailOtpStorage.verify(email, code);
  }
  
  if (!isValid) {
    // Check if code exists but is wrong
    const otp = emailOtpStorage.get(email);
    if (otp) {
      return NextResponse.json(
        { error: 'That code didn\'t work. Try again.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: 'Code expired. Resend a new code.' },
        { status: 400 }
      );
    }
  }

  // Find user and mark email as verified
  const user = userStorage.getByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Update user to verified
  userStorage.update(user.id, { emailVerified: true });

  // Return user info for auto sign-in (no password needed since we just verified)
  // Generate mock tokens for prototype
  const accessToken = `mock_token_${user.id}_${Date.now()}`;
  const refreshToken = `mock_refresh_${user.id}_${Date.now()}`;

  return NextResponse.json({ 
    success: true,
    email: user.email,
    userId: user.id,
    accessToken,
    refreshToken,
  });
}
