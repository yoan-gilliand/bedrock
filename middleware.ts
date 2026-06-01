import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page and public assets
  if (pathname === '/' || pathname === '/auth' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Check for session token in cookie
  const sessionToken = request.cookies.get('session_token')?.value;
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error('AUTH_USERNAME or AUTH_PASSWORD not configured');
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Session token format: "username:password"
  const expectedToken = `${validUsername}:${validPassword}`;

  // Validate token
  if (!sessionToken || sessionToken !== expectedToken) {
    // Redirect to login
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/utils/:path*',
    '/api/chat/:path*',
    '/api/documents/:path*'
  ],
};
