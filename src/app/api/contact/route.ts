import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Simple in-memory rate limiting (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 submissions per minute per email

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.lastReset >= RATE_LIMIT_WINDOW) {
    // Reset or create new entry
    rateLimitMap.set(identifier, { count: 1, lastReset: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  entry.count++;
  return false;
}

// Get client IP for additional rate limiting
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return ip;
}

// Fetch geolocation from IP (privacy-focused: no IP stored)
interface GeoLocation {
  country: string | null;
  city: string | null;
  countryCode: string | null;
}

async function getGeoLocation(ip: string): Promise<GeoLocation> {
  try {
    if (ip === "unknown" || ip === "127.0.0.1" || ip === "::1") {
      return { country: null, city: null, countryCode: null };
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,countryCode`, {
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      return { country: null, city: null, countryCode: null };
    }

    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country || null,
        city: data.city || null,
        countryCode: data.countryCode || null,
      };
    }

    return { country: null, city: null, countryCode: null };
  } catch (error) {
    console.error("Geolocation lookup failed:", error);
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
      // Return success to fool the bot, but don't save anything
      return NextResponse.json({ success: true });
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    // Validate inputs
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "invalid_name", message: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@") || email.length > 255) {
      return NextResponse.json(
        { error: "invalid_email", message: "Please enter a valid email" },
        { status: 400 }
      );
    }

    // Message validation - removed minimum length, only check for empty
    if (!message || message.trim().length === 0 || message.length > 5000) {
      return NextResponse.json(
        { error: "invalid_message", message: "Please enter a message" },
        { status: 400 }
      );
    }

    // ========================================
    // RATE LIMITING - Per email AND per IP
    // ========================================
    const normalizedEmail = email.trim().toLowerCase();
    const clientIP = getClientIP(request);

    // Check both email and IP rate limits
    if (isRateLimited(normalizedEmail) || isRateLimited(`ip:${clientIP}`)) {
      return NextResponse.json(
        { error: "too_many_requests", message: "Too many requests. Please wait." },
        { status: 429 }
      );
    }

    // Fetch geolocation (non-blocking, fail silently)
    const geoLocation = await getGeoLocation(clientIP);

    // Save to database (location saved with the IP for cross-referencing)
    await prisma.message.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        message: message.trim(),
        ipAddress: clientIP !== "unknown" ? clientIP : null,
        country: geoLocation.country,
        city: geoLocation.city,
        countryCode: geoLocation.countryCode,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "server_error", message: "Failed to send message" },
      { status: 500 }
    );
  }
}
