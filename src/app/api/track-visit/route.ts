import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// Rate limit: 1 log per IP per 5 minutes
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_INTERVAL = 5 * 60 * 1000; // 5 minutes

function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    return ip;
}

/**
 * Hash IP address using SHA-256 for privacy compliance.
 * The raw IP is never stored - only this one-way hash.
 */
function hashIP(ip: string): string {
    return crypto.createHash("sha256").update(ip).digest("hex");
}

interface GeoLocation {
    country: string | null;
    city: string | null;
}

async function getGeoLocation(ip: string): Promise<GeoLocation> {
    try {
        if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
            return { country: null, city: null };
        }

        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`, {
            next: { revalidate: 0 },
        });

        if (!response.ok) {
            return { country: null, city: null };
        }

        const data = await response.json();

        if (data.status === "success") {
            return {
                country: data.country || null,
                city: data.city || null,
            };
        }

        return { country: null, city: null };
    } catch (error) {
        console.error("Geolocation lookup failed:", error);
        return { country: null, city: null };
    }
}

/**
 * Check if this IP has subscribed or sent a message.
 * This is done in-memory at request time, then discarded.
 */
async function checkEngagement(ip: string): Promise<{ isSubscriber: boolean; hasMessaged: boolean }> {
    try {
        const [subscriber, message] = await Promise.all([
            prisma.subscriber.findFirst({
                where: { ipAddress: ip, isActive: true },
                select: { id: true },
            }),
            prisma.message.findFirst({
                where: { ipAddress: ip },
                select: { id: true },
            }),
        ]);

        return {
            isSubscriber: !!subscriber,
            hasMessaged: !!message,
        };
    } catch (error) {
        console.error("Engagement check failed:", error);
        return { isSubscriber: false, hasMessaged: false };
    }
}

export async function POST(request: NextRequest) {
    try {
        const clientIP = getClientIP(request);

        if (clientIP === "unknown") {
            return NextResponse.json({ success: true });
        }

        // Rate limiting: only log once per IP per 5 minutes
        const lastVisit = rateLimitMap.get(clientIP);
        const now = Date.now();

        if (lastVisit && now - lastVisit < RATE_LIMIT_INTERVAL) {
            return NextResponse.json({ success: true, cached: true });
        }

        rateLimitMap.set(clientIP, now);

        // Clean up old entries periodically
        if (rateLimitMap.size > 10000) {
            const cutoff = now - RATE_LIMIT_INTERVAL;
            Array.from(rateLimitMap.entries()).forEach(([ip, time]) => {
                if (time < cutoff) {
                    rateLimitMap.delete(ip);
                }
            });
        }

        // Get user agent
        const userAgent = request.headers.get("user-agent") || null;

        // Fetch geo-location and engagement status in parallel
        const [geoLocation, engagement] = await Promise.all([
            getGeoLocation(clientIP),
            checkEngagement(clientIP),
        ]);

        // Hash the IP before storing (privacy-compliant)
        const visitorHash = hashIP(clientIP);

        // Log the visit with hashed IP and engagement status
        await prisma.visitorLog.create({
            data: {
                visitorHash,
                country: geoLocation.country,
                city: geoLocation.city,
                userAgent: userAgent?.substring(0, 500) || null,
                isSubscriber: engagement.isSubscriber,
                hasMessaged: engagement.hasMessaged,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to log visit:", error);
        // Don't fail the request - tracking is non-critical
        return NextResponse.json({ success: true });
    }
}
