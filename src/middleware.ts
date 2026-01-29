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
            const url = new URL("/admin/login", request.url);
            url.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/api/admin/:path*"],
};
