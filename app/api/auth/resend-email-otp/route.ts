import { NextResponse } from 'next/server';
import { userStorage, emailOtpStorage } from '@/lib/storage';

// Generate a 6-digit OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  // Check if user exists
  const user = userStorage.getByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Check if already verified
  if (user.emailVerified) {
    return NextResponse.json(
      { error: 'Email is already verified' },
      { status: 400 }
    );
  }

  // Generate and store new OTP code (10 minutes expiry)
  const otpCode = generateOtpCode();
  emailOtpStorage.create(email, otpCode, 10 * 60 * 1000);

  // In production, send OTP via email service
  // For prototype, log it to console
  console.log(`[RESEND OTP] OTP code for ${email}: ${otpCode}`);

  return NextResponse.json({ 
    success: true,
    // In production, don't return OTP - only for prototype testing
    otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
  });
}
