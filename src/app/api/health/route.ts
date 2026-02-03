import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Build metadata injected at build time
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
const BUILD_ID = getBuildId();

function getBuildId(): string {
    try {
        // Read the build ID from .next/BUILD_ID (created by Next.js during build)
        const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
        if (fs.existsSync(buildIdPath)) {
            return fs.readFileSync(buildIdPath, "utf-8").trim();
        }
    } catch {
        // Ignore errors
    }
    return "development";
}

export async function GET() {
    return NextResponse.json(
        {
            status: "healthy",
            buildId: BUILD_ID,
            buildTime: BUILD_TIME,
            nodeEnv: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
        {
            headers: {
                // Prevent caching of health endpoint
                "Cache-Control": "no-store, no-cache, must-revalidate",
                // Expose build ID in header for easy debugging
                "X-Build-ID": BUILD_ID,
            },
        }
    );
}
