import { NextResponse } from 'next/server';
import { TOKEN_NAME, AUTH_COOKIE_OPTIONS } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(TOKEN_NAME, '', {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  return response;
}
