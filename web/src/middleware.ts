import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase-middleware';

// Define which paths should be protected
const protectedPaths = [
  '/api/portfolios/',
  '/api/trades/',
  '/api/transactions/',
  '/api/documents/',
  '/api/user/',
  '/dashboard',
  '/portfolio',
  '/trades',
  '/account',
];

// Define public API paths that don't need authentication
const publicApiPaths = [
  '/api/auth/session',
  '/api/webhooks/',
  '/login',
  '/register',
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/features',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // First, update the session (refresh tokens if needed)
  const response = await updateSession(request);
  
  // Only continue with auth checks for protected paths
  if (publicApiPaths.some(path => pathname.startsWith(path))) {
    return response;
  }

  // Check if the path is a protected path
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  // If it's not a protected path, allow the request
  if (!isProtectedPath) {
    return response;
  }

  try {
    // Get cookies from the request to check auth state
    const authCookie = request.cookies.get('sb-access-token') || 
                      request.cookies.get(Object.keys(request.cookies.getAll())
                          .find(key => key.includes('-auth-token')) || '');
    
    // If no auth cookie and this is a protected route, redirect to login
    if (!authCookie && isProtectedPath) {
      console.log('[MIDDLEWARE] No auth cookie for protected path');
      
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        if (request.headers.get('accept')?.includes('application/json')) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized: Invalid session' },
            { status: 401 }
          );
        }
      }
      
      // For pages, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow the request to proceed with refreshed tokens
    return response;
  } catch (error) {
    console.error('[MIDDLEWARE] Error in middleware:', error);
    
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      if (request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized: Server error' },
          { status: 401 }
        );
      }
    }
    
    // For pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure which paths should be handled by the middleware
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 