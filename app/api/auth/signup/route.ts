import { NextResponse } from 'next/server';
import { userStorage, emailOtpStorage } from '@/lib/storage';
import type { User } from '@/lib/types';

// Generate a 6-digit OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  const { email, password, phoneNumber } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = userStorage.getByEmail(email);
  if (existingUser) {
    return NextResponse.json(
      { error: 'User already exists' },
      { status: 400 }
    );
  }

  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const user: User = {
    id: userId,
    email,
    password, // In production, this would be hashed
    phoneNumber: phoneNumber || undefined,
    emailVerified: false, // Account created in pending verification state
  };

  userStorage.create(user);

  // Generate and store OTP code (10 minutes expiry)
  const otpCode = generateOtpCode();
  emailOtpStorage.create(email, otpCode, 10 * 60 * 1000);

  // In production, send OTP via email service
  // For prototype, log it to console
  console.log(`[SIGNUP] OTP code for ${email}: ${otpCode}`);

  return NextResponse.json({ 
    userId, 
    email, 
    verificationRequired: true,
    // In production, don't return OTP - only for prototype testing
    otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
  });
}
