import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for login page and public assets
  if (pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  // Check for session token in cookie
  const sessionToken = request.cookies.get('session_token')?.value;
  const expectedToken = process.env.APP_ACCESS_TOKEN || 'yoangilliand@gmail.com';

  // Validate token
  if (!sessionToken || sessionToken !== expectedToken) {
    // Redirect to login
    return NextResponse.redirect(new URL('/', request.url));
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
