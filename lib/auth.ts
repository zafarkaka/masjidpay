import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'masjidpay_super_secret_jwt_key_2026';
export const TOKEN_NAME = 'masjidpay_token';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  masjidId?: string;
  masjidSlug?: string;
  masjidStatus?: string;
  masjidName?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(password, hashed);
}

export function signToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (error) {
    return null;
  }
}

export function signOtpToken(payload: { email: string; otp: string; purpose?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function verifyOtpToken(token: string): { email: string; otp: string; purpose?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { email: string; otp: string; purpose?: string };
  } catch (error) {
    return null;
  }
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export function setAuthCookie(token: string) {
  try {
    const cookieStore = cookies();
    cookieStore.set(TOKEN_NAME, token, AUTH_COOKIE_OPTIONS);
  } catch (e) {
    // Non-fatal
  }
}

export function clearAuthCookie() {
  try {
    const cookieStore = cookies();
    cookieStore.set(TOKEN_NAME, '', {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: 0,
    });
  } catch (e) {
    // Non-fatal
  }
}

export function getCurrentSession(): UserSession | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (e) {
    return null;
  }
}
