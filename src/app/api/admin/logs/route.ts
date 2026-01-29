import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit-logger";

// GET - Fetch logs from database
export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const level = searchParams.get("level") || undefined;
  const action = searchParams.get("action") || undefined;
  const username = searchParams.get("username") || undefined;

  try {
    // Build where clause
    const where: any = {};
    if (level && level !== "all") where.level = level;
    if (action) where.action = { contains: action };
    if (username) where.username = { contains: username };

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
      prisma.systemLog.count({ where }),
    ]);

    // Get stats
    const [infoCount, warnCount, errorCount] = await Promise.all([
      prisma.systemLog.count({ where: { level: "INFO" } }),
      prisma.systemLog.count({ where: { level: "WARN" } }),
      prisma.systemLog.count({ where: { level: "ERROR" } }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        info: infoCount,
        warn: warnCount,
        error: errorCount,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// DELETE - Clear logs (optional: by age or all)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysOld = searchParams.get("daysOld");
  const clearAll = searchParams.get("clearAll") === "true";

  try {
    let deletedCount = 0;
    const username = (session.user as any)?.username || "Unknown";

    if (clearAll) {
      // Clear all logs
      const result = await prisma.systemLog.deleteMany();
      deletedCount = result.count;
    } else if (daysOld) {
      // Clear logs older than X days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));
      
      const result = await prisma.systemLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });
      deletedCount = result.count;
    } else {
      return NextResponse.json(
        { error: "Specify daysOld or clearAll=true" },
        { status: 400 }
      );
    }

    // Log the clear action (after clearing so this one stays)
    await logAdminAction(
      username,
      "CLEAR_LOGS",
      `Cleared ${deletedCount} log entries${daysOld ? ` older than ${daysOld} days` : " (all logs)"}`,
      { level: "WARN" }
    );

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} log entries`,
    });
  } catch (error) {
    console.error("Error clearing logs:", error);
    return NextResponse.json(
      { error: "Failed to clear logs" },
      { status: 500 }
    );
  }
}
