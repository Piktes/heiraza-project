import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.lastReset >= RATE_LIMIT_WINDOW) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

// Get client IP for additional rate limiting - check multiple headers
function getClientIP(request: NextRequest): string {
  // Check multiple headers in order of reliability
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  let ip = "unknown";

  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first (client)
    ip = xForwardedFor.split(",")[0].trim();
  } else if (xRealIP) {
    ip = xRealIP.trim();
  } else if (cfConnectingIP) {
    ip = cfConnectingIP.trim();
  }

  // Log for debugging (remove in production if noisy)
  console.log(`[Subscribe] IP detection: x-forwarded-for=${xForwardedFor}, x-real-ip=${xRealIP}, result=${ip}`);

  return ip;
}

// Fetch geolocation from IP (privacy-focused: no raw IP stored after lookup)
interface GeoLocation {
  country: string | null;
  city: string | null;
  countryCode: string | null;
}

async function getGeoLocation(ip: string): Promise<GeoLocation> {
  try {
    if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
      console.log(`[Subscribe] Skipping geolocation for local/unknown IP: ${ip}`);
      return { country: null, city: null, countryCode: null };
    }

    console.log(`[Subscribe] Looking up geolocation for IP: ${ip}`);
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,countryCode`, {
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.log(`[Subscribe] Geolocation API returned ${response.status}`);
      return { country: null, city: null, countryCode: null };
    }

    const data = await response.json();
    console.log(`[Subscribe] Geolocation result:`, data);

    if (data.status === "success") {
      return {
        country: data.country || null,
        city: data.city || null,
        countryCode: data.countryCode || null,
      };
    }

    return { country: null, city: null, countryCode: null };
  } catch (error) {
    console.error("[Subscribe] Geolocation lookup failed:", error);
    return { country: null, city: null, countryCode: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // ========================================
    // HONEYPOT CHECK - Anti-spam protection
    // ========================================
    const honeypot = formData.get("_honey") as string;
    const honeypot2 = formData.get("website") as string;

    // If honeypot fields have any value, it's a bot - reject silently
    if (honeypot || honeypot2) {
      return NextResponse.json({ success: true });
    }

    const email = formData.get("email") as string;
    const receiveEventAlerts = formData.get("receiveEventAlerts") === "true";

    // Validate email
    if (!email || !email.includes("@") || email.length > 255) {
      return NextResponse.json(
        { error: "invalid_email", message: "Please enter a valid email" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(request);

    // ========================================
    // RATE LIMITING - Per email AND per IP
    // ========================================
    if (isRateLimited(normalizedEmail) || isRateLimited(`ip:${clientIP}`)) {
      return NextResponse.json(
        { error: "too_many_requests", message: "Too many requests. Please wait." },
        { status: 429 }
      );
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      // Check if this is a re-subscribe (user was unsubscribed)
      const wasInactive = !existing.isActive;

      // Update subscriber - reactivate if needed and update event alerts preference
      await prisma.subscriber.update({
        where: { email: normalizedEmail },
        data: {
          receiveEventAlerts,
          isActive: true, // Reactivate if they were unsubscribed
          unsubscribeReason: wasInactive ? null : existing.unsubscribeReason, // Clear reason if reactivating
        },
      });

      return NextResponse.json({
        success: true,
        updated: true,
        reactivated: wasInactive,
        eventAlertsEnabled: receiveEventAlerts,
        message: wasInactive
          ? "Welcome back! Your subscription has been reactivated."
          : receiveEventAlerts
            ? "Event notifications enabled!"
            : "Your preferences have been updated."
      });
    }

    // Fetch geolocation (non-blocking, fail silently)
    const geoLocation = await getGeoLocation(clientIP);

    // Create new subscriber with event alerts preference and location
    await prisma.subscriber.create({
      data: {
        email: normalizedEmail,
        receiveEventAlerts,
        ipAddress: clientIP !== "unknown" ? clientIP : null,
        country: geoLocation.country,
        city: geoLocation.city,
        countryCode: geoLocation.countryCode,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
