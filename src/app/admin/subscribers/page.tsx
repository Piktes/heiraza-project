import Link from "next/link";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/logger";
import { ThemeToggle } from "@/components/theme-toggle";
import { SubscribersList } from "@/components/admin/subscribers-list";
import {
    Music2, ArrowUpRight, Home, Users, UserCheck, UserMinus, Search, Filter,
} from "lucide-react";

// Convert country code to flag emoji
function countryCodeToFlag(countryCode: string | null | undefined): string {
    if (!countryCode || countryCode.length !== 2) return "";
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}

async function getArtist() {
    return prisma.artist.findFirst();
}

async function getStats() {
    const [total, eventFans, unsubscribed] = await Promise.all([
        prisma.subscriber.count(),
        prisma.subscriber.count({ where: { receiveEventAlerts: true, isActive: true } }),
        prisma.subscriber.count({ where: { isActive: false } }),
    ]);
    return { total, eventFans, unsubscribed };
}

async function getSubscribers(search?: string, status?: string) {
    const where: any = {};

    if (status === "active") {
        where.isActive = true;
    } else if (status === "unsubscribed") {
        where.isActive = false;
    }

    if (search) {
        where.OR = [
            { email: { contains: search } },
            { country: { contains: search } },
            { city: { contains: search } },
            { unsubscribeReason: { contains: search } },
        ];
    }

    return prisma.subscriber.findMany({
        where,
        orderBy: { joinedAt: "desc" },
    });
}

// Server action to delete subscriber
async function deleteSubscriber(formData: FormData) {
    "use server";
    const id = parseInt(formData.get("id") as string);

    // Get subscriber email for logging before deletion
    const subscriber = await prisma.subscriber.findUnique({ where: { id } });

    await prisma.subscriber.delete({ where: { id } });

    // Log the deletion action
    logAction(
        "Sahadmin",
        "DELETE_SUBSCRIBER",
        `Deleted subscriber: ${subscriber?.email || "Unknown"}`
    );

    revalidatePath("/admin/subscribers");
}

export default async function SubscribersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string }>;
}) {
    const params = await searchParams;
    const [artist, stats, subscribers] = await Promise.all([
        getArtist(),
        getStats(),
        getSubscribers(params.search, params.status),
    ]);

    // Pre-process subscribers with flags
    const subscribersWithFlags = subscribers.map((sub) => ({
        ...sub,
        flag: countryCodeToFlag(sub.countryCode),
    }));

    return (
        <div className="min-h-screen gradient-warm-bg grain">
            <header className="sticky top-0 z-50 px-4 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
                        <Link href="/admin" className="flex items-center gap-2">
                            <Music2 size={24} className="text-accent-coral" />
                            <span className="font-display text-xl tracking-widest uppercase">{artist?.name || "Heiraza"}</span>
                            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground ml-2 px-2 py-1 bg-muted rounded-full">Admin</span>
                        </Link>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Link href="/" target="_blank" className="btn-ghost flex items-center gap-2 text-sm">View Site <ArrowUpRight size={14} /></Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 pb-10">
                {/* Back Link */}
                <Link href="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <Home size={16} />
                    <span>Back to Dashboard</span>
                </Link>

                {/* Page Header */}
                <div className="mb-6">
                    <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                        <Users className="text-accent-coral" size={32} />
                        Subscribers
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your newsletter subscribers and view analytics.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    {/* Total Subscribers */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-accent-coral/10">
                                <Users size={24} className="text-accent-coral" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Subscribers</p>
                                <p className="text-2xl font-display">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    {/* Event Fans */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <UserCheck size={24} className="text-green-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Event Fans</p>
                                <p className="text-2xl font-display">{stats.eventFans}</p>
                            </div>
                        </div>
                    </div>

                    {/* Unsubscribed */}
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <UserMinus size={24} className="text-red-500" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unsubscribed</p>
                                <p className="text-2xl font-display">{stats.unsubscribed}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-4 mb-6">
                    <form className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px] relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                name="search"
                                defaultValue={params.search}
                                placeholder="Search email, location, or unsubscribe reason..."
                                className="input-field pl-10 w-full"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select name="status" defaultValue={params.status || "all"} className="input-field pr-8">
                                <option value="all">All Subscribers</option>
                                <option value="active">Active Only</option>
                                <option value="unsubscribed">Unsubscribed Only</option>
                            </select>
                            <button type="submit" className="btn-primary flex items-center gap-2">
                                <Filter size={16} />
                                Apply
                            </button>
                        </div>
                    </form>
                </div>

                {/* Subscribers Table */}
                {subscribersWithFlags.length > 0 ? (
                    <SubscribersList
                        subscribers={subscribersWithFlags}
                        deleteAction={deleteSubscriber}
                    />
                ) : (
                    <div className="glass-card py-20 text-center text-muted-foreground">
                        <Users className="mx-auto mb-4" size={48} />
                        <p className="text-lg">No subscribers found</p>
                        <p className="text-sm mt-1">
                            {params.search || params.status !== "all"
                                ? "Try adjusting your search or filters"
                                : "Subscribers will appear here when users sign up"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
