import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { existsSync, accessSync, constants, mkdirSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

// Debug endpoint to diagnose VPS issues
export async function GET(request: NextRequest) {
    const session = await getServerSession();

    // Only allow authenticated admins
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const diagnostics: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        platform: process.platform,
        cwd: process.cwd(),
        checks: {},
        errors: [],
    };

    // Check 1: Current working directory
    try {
        diagnostics.checks.cwd = {
            path: process.cwd(),
            exists: existsSync(process.cwd()),
        };
    } catch (e: any) {
        diagnostics.errors.push({ check: "cwd", error: e.message });
    }

    // Check 2: Public folder
    const publicPath = join(process.cwd(), "public");
    try {
        diagnostics.checks.publicFolder = {
            path: publicPath,
            exists: existsSync(publicPath),
            readable: false,
            writable: false,
        };
        if (existsSync(publicPath)) {
            try {
                accessSync(publicPath, constants.R_OK);
                diagnostics.checks.publicFolder.readable = true;
            } catch { }
            try {
                accessSync(publicPath, constants.W_OK);
                diagnostics.checks.publicFolder.writable = true;
            } catch { }
        }
    } catch (e: any) {
        diagnostics.errors.push({ check: "publicFolder", error: e.message });
    }

    // Check 3: Uploads folder
    const uploadsPath = join(process.cwd(), "public", "uploads");
    try {
        diagnostics.checks.uploadsFolder = {
            path: uploadsPath,
            exists: existsSync(uploadsPath),
            readable: false,
            writable: false,
        };
        if (existsSync(uploadsPath)) {
            try {
                accessSync(uploadsPath, constants.R_OK);
                diagnostics.checks.uploadsFolder.readable = true;
            } catch { }
            try {
                accessSync(uploadsPath, constants.W_OK);
                diagnostics.checks.uploadsFolder.writable = true;
            } catch { }
        }
    } catch (e: any) {
        diagnostics.errors.push({ check: "uploadsFolder", error: e.message });
    }

    // Check 4: Write test
    const testFilePath = join(uploadsPath, ".write-test-" + Date.now() + ".tmp");
    try {
        // Create uploads folder if it doesn't exist
        if (!existsSync(uploadsPath)) {
            mkdirSync(uploadsPath, { recursive: true });
            diagnostics.checks.uploadsCreated = true;
        }

        // Try writing a test file
        writeFileSync(testFilePath, "test");
        diagnostics.checks.writeTest = { success: true, path: testFilePath };

        // Clean up
        unlinkSync(testFilePath);
        diagnostics.checks.writeTest.deleted = true;
    } catch (e: any) {
        diagnostics.errors.push({ check: "writeTest", error: e.message, stack: e.stack });
    }

    // Check 5: Database connection
    try {
        const prisma = (await import("@/lib/prisma")).default;
        await prisma.$queryRaw`SELECT 1`;
        diagnostics.checks.database = { connected: true };
    } catch (e: any) {
        diagnostics.errors.push({ check: "database", error: e.message });
        diagnostics.checks.database = { connected: false };
    }

    // Check 6: Request headers (for debugging proxy issues)
    diagnostics.headers = {
        host: request.headers.get("host"),
        xForwardedProto: request.headers.get("x-forwarded-proto"),
        xForwardedFor: request.headers.get("x-forwarded-for"),
        xForwardedHost: request.headers.get("x-forwarded-host"),
    };

    // Overall status
    diagnostics.healthy = diagnostics.errors.length === 0;

    return NextResponse.json(diagnostics, {
        status: diagnostics.healthy ? 200 : 500
    });
}
