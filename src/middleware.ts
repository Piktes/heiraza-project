import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const PUBLIC_PATHS = [
    "/admin/login",
    "/api/auth", // next-auth endpoints
];

/**
 * Helper to get first value from potentially comma-separated header
 * LiteSpeed/Nginx proxies can duplicate headers, causing "value, value" format
 */
function getFirstHeaderValue(request: NextRequest, headerName: string, fallback: string): string {
    const value = request.headers.get(headerName);
    if (!value) return fallback;
    // Take only the FIRST value if comma-separated (proxy duplication fix)
    return value.split(',')[0].trim();
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1. Safe parsing of host and protocol for Reverse Proxy compatibility (LiteSpeed/Nginx)
    // CRITICAL: Headers may be duplicated like "value, value" - always take first
    const host = getFirstHeaderValue(request, 'host', 'localhost:3001');
    const forwardedHost = getFirstHeaderValue(request, 'x-forwarded-host', host);
    const proto = getFirstHeaderValue(request, 'x-forwarded-proto', 'http');

    // Use forwarded host if available (behind proxy), otherwise use host header
    const effectiveHost = forwardedHost || host;

    // Use NEXTAUTH_URL from env if available (safest), otherwise construct from headers
    const baseUrl = process.env.NEXTAUTH_URL || `${proto}://${effectiveHost}`;
    const origin = getFirstHeaderValue(request, "origin", baseUrl);

    // FORCE HTTPS (Skip for localhost development) - ONLY for safe methods to avoid breaking POSTs
    const isSafeMethod = request.method === "GET" || request.method === "HEAD";
    if (process.env.NODE_ENV === 'production' && proto === 'http' && isSafeMethod) {
        return NextResponse.redirect(`https://${effectiveHost}${pathname}${request.nextUrl.search}`, 301);
    }

    // Check if this path is public (login or auth API)
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (isPublicPath) {
        // Even for public paths, normalize headers to prevent issues in server actions
        const response = NextResponse.next();
        response.headers.set('x-normalized-host', effectiveHost);
        response.headers.set('x-normalized-proto', proto);
        return response;
    }

    // Protect both /admin/* pages and /api/admin/* endpoints
    const isProtectedPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

    if (isProtectedPath) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        if (!token) {
            // For API routes, return 401 Unauthorized
            if (pathname.startsWith("/api/")) {
                return NextResponse.json(
                    { error: "Unauthorized", message: "Authentication required" },
                    { status: 401 }
                );
            }

            // For pages, redirect to login
            // Use baseUrl to prevent ERR_INVALID_URL behind proxies
            const url = new URL("/admin/login", origin);
            url.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(url);
        }
    }

    // For all requests, set normalized headers to prevent duplication issues
    const response = NextResponse.next();
    response.headers.set('x-normalized-host', effectiveHost);
    response.headers.set('x-normalized-proto', proto);
    return response;
}

// Match ALL routes so we can normalize headers for server actions
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - robots.txt
         * - site.webmanifest
         * - uploads (static uploads)
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|site.webmanifest|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
