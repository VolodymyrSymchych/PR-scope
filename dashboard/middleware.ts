import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Validate JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Simple Redis cache for Edge Runtime (using fetch API)
async function getCachedSession(token: string): Promise<string | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/session:${token}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.result;
  } catch (error) {
    return null;
  }
}

async function cacheSession(token: string, userId: string, ttl: number = 3600): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return;
  }

  try {
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/set/session:${token}/${userId}/ex/${ttl}`, {
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      },
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Cache session error:', error);
  }
}

// Routes that require authentication
const protectedRoutes = [
  '/',
  '/dashboard',
  '/projects',
  '/tasks',
  '/team',
  '/settings',
  '/reports',
  '/attendance',
  '/billing',
  '/messages',
  '/friends',
  '/timeline',
  '/projects-timeline',
];

// Public routes that authenticated users shouldn't access
const authRoutes = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Check if the route needs protection
    const isProtectedRoute = protectedRoutes.some(route =>
      route === '/' ? pathname === '/' : pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // Skip middleware for non-protected and non-auth routes
    if (!isProtectedRoute && !isAuthRoute) {
      return NextResponse.next();
    }

    // Get the session token
    const token = request.cookies.get('session')?.value;

    // Verify authentication
    let isAuthenticated = false;
    let userId: string | null = null;

    if (token) {
      try {
        // Try to get from cache first
        const cachedUserId = await getCachedSession(token);

        if (cachedUserId) {
          // Cache hit - skip JWT verification
          isAuthenticated = true;
          userId = cachedUserId;
        } else {
          // Cache miss - verify JWT
          const { payload } = await jwtVerify(token, JWT_SECRET);
          isAuthenticated = true;
          userId = payload.userId as string;

          // Cache the session for future requests (1 hour TTL)
          await cacheSession(token, userId, 3600);
        }
      } catch (error) {
        // Token is invalid or expired
        isAuthenticated = false;
      }
    }

    // Redirect logic
    if (isProtectedRoute && !isAuthenticated) {
      const url = new URL('/sign-in', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && isAuthenticated) {
      return NextResponse.redirect(new URL('/projects', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // Log error but don't crash the middleware
    console.error('Middleware error:', error);
    // Allow the request to continue on error
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png (favicon files)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.png|public).*)',
  ],
};

