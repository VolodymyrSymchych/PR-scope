import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

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
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        isAuthenticated = true;
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

