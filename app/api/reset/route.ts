import { NextResponse } from 'next/server';
import { clearAllStorage } from '@/lib/storage';

export async function POST() {
  clearAllStorage();
  return NextResponse.json({ success: true });
}
