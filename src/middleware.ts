import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const PUBLIC_PATHS = [
    "/admin/login",
    "/api/auth", // next-auth endpoints
];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // 1. Safe parsing of host and protocol for Reverse Proxy compatibility (LiteSpeed/Nginx)
    const host = request.headers.get('host')?.split(',')[0].trim() || 'localhost:3000'; // Fallback to localhost if missing
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() || 'http'; // Default to http if missing
    const baseUrl = `${proto}://${host}`;

    // FORCE HTTPS (Skip for localhost development)
    if (process.env.NODE_ENV === 'production' && proto === 'http') {
        return NextResponse.redirect(`https://${host}${pathname}`, 301);
    }

    // Check if this path is public (login or auth API)
    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
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
            const url = new URL("/admin/login", baseUrl);
            url.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
