import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Validate JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const SESSION_DURATION = 7 * 24 * 60 * 60;

export interface SessionData {
  userId: number;
  email: string;
  username: string;
}

export async function createSession(data: SessionData) {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  
  // Determine if we're in production (Vercel)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: isProduction, // Use secure cookies in production (Vercel uses HTTPS)
    sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility with Vercel
    maxAge: SESSION_DURATION,
    path: '/',
    // Don't set domain - let browser handle it automatically for better compatibility
  });

  return token;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (!payload.userId || !payload.email || !payload.username) {
      return null;
    }
    
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      username: payload.username as string,
    };
  } catch (error) {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function requireAuth(request?: NextRequest): Promise<SessionData> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}
