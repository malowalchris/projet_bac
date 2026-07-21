import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Rate Limiting for sensitive API routes (brute-force & spam protection)
  const isRateLimitRoute = 
    pathname === '/api/auth/login' || 
    pathname === '/api/auth/register' || 
    (pathname === '/api/orders' && request.method === 'POST');

  if (isRateLimitRoute) {
    const ip = (request as { ip?: string }).ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recentTimestamps = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW);

    if (recentTimestamps.length >= MAX_REQUESTS) {
      return new NextResponse(
        JSON.stringify({ error: "Trop de requêtes. Veuillez réessayer dans une minute." }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    recentTimestamps.push(now);
    rateLimitMap.set(ip, recentTimestamps);
  }

  // Pour toutes les autres routes API (/api/products, /api/stores, /api/search/suggestions, etc.),
  // on ne vérifie pas le JWT dans le proxy pour éviter de ralentir chaque requête de données/autocomplétion.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('mcf_jwt_session')?.value;

  const PROTECTED_ROUTES = [
    '/profile',
    '/checkout',
    '/favorites',
    '/admin'
  ];
  const ADMIN_ROUTES = ['/admin'];

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  // Determine callback url with search query preserved
  const callbackUrl = `${pathname}${search}`;

  if (isProtectedRoute && !token) {
    const url = new URL('/', request.url);
    url.searchParams.set('auth', 'login');
    url.searchParams.set('callbackUrl', callbackUrl);
    return NextResponse.redirect(url);
  }

  let decodedToken = null;
  if (token) {
      decodedToken = await verifyJWT(token);
  }

  if (isProtectedRoute && !decodedToken) {
     const url = new URL('/', request.url);
     url.searchParams.set('auth', 'login');
     url.searchParams.set('callbackUrl', callbackUrl);
     
     // remove invalid cookie
     const response = NextResponse.redirect(url);
     response.cookies.delete('mcf_jwt_session');
     return response;
  }

  if (isAdminRoute && decodedToken) {
    if (decodedToken.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Prevent logged-in admins from accessing client-facing/public store pages
  if (decodedToken && decodedToken.role === 'ADMIN' && !isAdminRoute) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Exclut impérativement :
     * - _next/static (fichiers statiques JS/CSS du bundle)
     * - _next/image (optimisation d'images)
     * - favicon.ico, sitemap.xml, robots.txt
     * - images et extensions statiques (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .css, .js)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
