import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add paths that require authentication
const protectedPaths = ['/dashboard', '/complete-profile'];
// Add paths that are only for non-authenticated users
const publicOnlyPaths = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('__session')?.value;

  // If the path is public only (like login) and user is authenticated, redirect to dashboard
  if (publicOnlyPaths.includes(path) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the path is protected and user is not authenticated, redirect to login
  if (protectedPaths.includes(path) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/dashboard',
    '/complete-profile',
    '/login',
    '/signup',
  ],
}; 