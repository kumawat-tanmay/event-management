import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // We check for auth token in cookies
  const token = request.cookies.get('krishna_token')?.value;
  const { pathname } = request.nextUrl;

  // The dashboard is at '/'
  // Public auth routes (unprotected)
  const isAuthRoute = 
    pathname === '/login' || 
    pathname.startsWith('/forgot-password') || 
    pathname.startsWith('/reset-password');
  
  // Exclude static paths, API routes, and auth paths to determine if it's a protected route
  const isProtectedRoute = !isAuthRoute && !pathname.startsWith('/api') && !pathname.startsWith('/_next');

  if (isProtectedRoute && !token) {
    // Redirect to login if accessing protected route without a token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && token) {
    // Redirect to root (dashboard) if trying to access auth pages while already authenticated
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
