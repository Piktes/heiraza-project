import prisma from "@/lib/prisma";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export type AdminAction =
  // Auth
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  // Tracks
  | "CREATE_TRACK"
  | "UPDATE_TRACK"
  | "DELETE_TRACK"
  | "TOGGLE_TRACK"
  | "REORDER_TRACK"
  // Videos
  | "CREATE_VIDEO"
  | "UPDATE_VIDEO"
  | "DELETE_VIDEO"
  | "TOGGLE_VIDEO"
  // Gallery
  | "CREATE_GALLERY_IMAGE"
  | "CREATE_GALLERY_IMAGES"
  | "UPDATE_GALLERY_IMAGE"
  | "DELETE_GALLERY_IMAGE"
  | "TOGGLE_GALLERY_IMAGE"
  | "REORDER_GALLERY"
  // Events
  | "CREATE_EVENT"
  | "UPDATE_EVENT"
  | "DELETE_EVENT"
  | "TOGGLE_EVENT"
  // Products
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "DELETE_PRODUCT"
  | "TOGGLE_PRODUCT"
  // Popups
  | "CREATE_POPUP"
  | "UPDATE_POPUP"
  | "DELETE_POPUP"
  | "TOGGLE_POPUP"
  // Artist/Bio
  | "UPDATE_BIO"
  | "UPDATE_ARTIST"
  // Hero Images
  | "CREATE_HERO_IMAGE"
  | "DELETE_HERO_IMAGE"
  | "TOGGLE_HERO_IMAGE"
  | "REORDER_HERO"
  // Bio Images
  | "CREATE_BIO_IMAGE"
  | "DELETE_BIO_IMAGE"
  | "TOGGLE_BIO_IMAGE"
  // Settings
  | "UPDATE_SETTINGS"
  | "UPDATE_SITE_SETTING"
  // Social Media
  | "UPDATE_SOCIAL_LINKS"
  // Messages
  | "READ_MESSAGE"
  | "DELETE_MESSAGE"
  | "REPLY_MESSAGE"
  // Subscribers
  | "DELETE_SUBSCRIBER"
  | "EXPORT_SUBSCRIBERS"
  // Users
  | "CREATE_USER"
  | "DELETE_USER"
  | "UPDATE_USER"
  // Email
  | "UPDATE_EMAIL_SIGNATURE"
  | "UPDATE_EMAIL_TEMPLATE"
  | "SEND_ANNOUNCEMENT"
  // Press Kit
  | "UPDATE_PRESS_KIT_BIO"
  | "CREATE_PRESS_PHOTO"
  | "UPDATE_PRESS_PHOTO"
  | "DELETE_PRESS_PHOTO"
  | "TOGGLE_PRESS_PHOTO"
  | "REORDER_PRESS_PHOTOS"
  | "CREATE_MUSIC_HIGHLIGHT"
  | "UPDATE_MUSIC_HIGHLIGHT"
  | "DELETE_MUSIC_HIGHLIGHT"
  | "REORDER_MUSIC_HIGHLIGHTS"
  | "CREATE_PRESS_VIDEO"
  | "UPDATE_PRESS_VIDEO"
  | "DELETE_PRESS_VIDEO"
  | "REORDER_PRESS_VIDEOS"
  | "CREATE_QUOTE_CATEGORY"
  | "UPDATE_QUOTE_CATEGORY"
  | "DELETE_QUOTE_CATEGORY"
  | "CREATE_PRESS_QUOTE"
  | "UPDATE_PRESS_QUOTE"
  | "DELETE_PRESS_QUOTE"
  | "TOGGLE_PRESS_QUOTE"
  | "UPDATE_PRESS_KIT_CONTACT"
  | "UPDATE_PRESS_KIT_SETTINGS"
  // Other
  | "CLEAR_LOGS"
  | "SYSTEM_ERROR";

interface LogOptions {
  level?: LogLevel;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an admin action to the database
 * @param username - The admin username performing the action
 * @param action - The action being performed
 * @param details - Human-readable description of what happened
 * @param options - Additional options (level, userId, ip, userAgent)
 */
export async function logAdminAction(
  username: string,
  action: AdminAction,
  details: string,
  options: LogOptions = {}
): Promise<void> {
  const { level = "INFO", userId, ipAddress, userAgent } = options;

  try {
    await prisma.systemLog.create({
      data: {
        level,
        action,
        username,
        details,
        userId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw - logging should never break the app
    console.error("[AUDIT LOG ERROR]", error);
  }
}

/**
 * Log an error to the system logs
 */
export async function logSystemError(
  username: string,
  action: string,
  error: Error | string,
  options: LogOptions = {}
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  const details = `Error: ${errorMessage}`;

  await logAdminAction(username, "SYSTEM_ERROR", details, {
    ...options,
    level: "ERROR",
  });
}

/**
 * Get request metadata for logging
 */
export function getRequestMeta(request: Request): { ipAddress?: string; userAgent?: string } {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;
  const userAgent = request.headers.get("user-agent") || undefined;

  return { ipAddress, userAgent };
}

/**
 * Fetch system logs with pagination and filters
 */
export async function getSystemLogs(options: {
  page?: number;
  limit?: number;
  level?: LogLevel;
  action?: string;
  username?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const {
    page = 1,
    limit = 50,
    level,
    action,
    username,
    startDate,
    endDate,
  } = options;

  const where: any = {};

  if (level) where.level = level;
  if (action) where.action = { contains: action };
  if (username) where.username = { contains: username };
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

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
            email: true,
          },
        },
      },
    }),
    prisma.systemLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Clear old logs (keep last N days)
 */
export async function clearOldLogs(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.systemLog.deleteMany({
    where: {
      timestamp: { lt: cutoffDate },
    },
  });

  return result.count;
}

export default logAdminAction;
