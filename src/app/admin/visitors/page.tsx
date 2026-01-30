"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Eye, RefreshCw, Loader2, MapPin, Users, MessageSquare,
    TrendingUp, Filter, ChevronLeft, ChevronRight, Globe, Flag
} from "lucide-react";
import { InfoBar } from "@/components/admin/info-bar";

// Country code to flag emoji mapping
const countryToFlag: Record<string, string> = {
    "United States": "🇺🇸",
    "USA": "🇺🇸",
    "United Kingdom": "🇬🇧",
    "UK": "🇬🇧",
    "Canada": "🇨🇦",
    "Germany": "🇩🇪",
    "France": "🇫🇷",
    "Italy": "🇮🇹",
    "Spain": "🇪🇸",
    "Netherlands": "🇳🇱",
    "Australia": "🇦🇺",
    "Japan": "🇯🇵",
    "China": "🇨🇳",
    "India": "🇮🇳",
    "Brazil": "🇧🇷",
    "Mexico": "🇲🇽",
    "Turkey": "🇹🇷",
    "Russia": "🇷🇺",
    "South Korea": "🇰🇷",
    "Poland": "🇵🇱",
    "Sweden": "🇸🇪",
    "Norway": "🇳🇴",
    "Denmark": "🇩🇰",
    "Finland": "🇫🇮",
    "Ireland": "🇮🇪",
    "Portugal": "🇵🇹",
    "Switzerland": "🇨🇭",
    "Austria": "🇦🇹",
    "Belgium": "🇧🇪",
    "Argentina": "🇦🇷",
    "South Africa": "🇿🇦",
    "Egypt": "🇪🇬",
    "Nigeria": "🇳🇬",
    "Kenya": "🇰🇪",
    "Indonesia": "🇮🇩",
    "Thailand": "🇹🇭",
    "Vietnam": "🇻🇳",
    "Philippines": "🇵🇭",
    "Malaysia": "🇲🇾",
    "Singapore": "🇸🇬",
    "New Zealand": "🇳🇿",
    "Israel": "🇮🇱",
    "United Arab Emirates": "🇦🇪",
    "Saudi Arabia": "🇸🇦",
};

function getCountryFlag(country: string): string {
    return countryToFlag[country] || "🌍";
}

interface Visitor {
    visitorHash: string;
    country: string | null;
    city: string | null;
    lastVisit: string;
    visitCount: number;
    isSubscriber: boolean;
    hasMessaged: boolean;
}

interface TopCountry {
    country: string;
    count: number;
}

interface VisitorsResponse {
    visitors: Visitor[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        totalVisits: number;
        uniqueVisitors: number;
        subscribersCount: number;
        messagesCount: number;
        conversionRate: string;
    };
    topCountries: TopCountry[];
    availableCountries: string[];
    period: string;
    countryFilter: string | null;
}

export default function AdminVisitorsPage() {
    const [data, setData] = useState<VisitorsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("week");
    const [country, setCountry] = useState<string>("");
    const [page, setPage] = useState(1);
    const limit = 30;

    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                period,
                page: page.toString(),
                limit: limit.toString(),
            });
            if (country) {
                params.set("country", country);
            }

            const res = await fetch(`/api/admin/visitors?${params}`);
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Failed to fetch visitors");

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch visitors");
        } finally {
            setLoading(false);
        }
    }, [period, country, page]);

    useEffect(() => {
        fetchVisitors();
    }, [fetchVisitors]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPeriodLabel = () => {
        switch (period) {
            case "today": return "Today";
            case "year": return "Last Year";
            case "month": return "Last Month";
            default: return "Last 7 Days";
        }
    };

    return (
        <div className="min-h-screen">
            {/* InfoBar */}
            <InfoBar counter={data?.stats ? `${data.stats.uniqueVisitors} unique visitors` : undefined} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-10">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-display text-display-md tracking-wider uppercase">Visitors</h1>
                        <p className="text-muted-foreground mt-2">Privacy-compliant visitor analytics</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchVisitors()}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Period Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-muted-foreground" />
                            <span className="text-sm font-medium">Time:</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(["today", "week", "month", "year"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => { setPeriod(p); setPage(1); }}
                                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${period === p
                                        ? "bg-accent-coral text-white"
                                        : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {p === "today" ? "Today" : p === "week" ? "Weekly" : p === "month" ? "Monthly" : "Yearly"}
                                </button>
                            ))}
                        </div>

                        {/* Country Filter */}
                        <div className="flex items-center gap-2 ml-auto">
                            <Globe size={16} className="text-muted-foreground" />
                            <select
                                value={country}
                                onChange={(e) => { setCountry(e.target.value); setPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-accent-coral/20"
                            >
                                <option value="">All Countries</option>
                                {data?.availableCountries?.map((c) => (
                                    <option key={c} value={c}>
                                        {getCountryFlag(c)} {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Top 3 Countries Widget */}
                {data?.topCountries && data.topCountries.length > 0 && (
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Flag size={16} className="text-accent-coral" />
                            <span className="font-medium">Top Countries</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {data.topCountries.map((c, idx) => (
                                <div
                                    key={c.country}
                                    className={`flex flex-col items-center justify-center text-center p-4 rounded-xl ${idx === 0 ? "bg-yellow-500/10" :
                                        idx === 1 ? "bg-gray-500/10" :
                                            "bg-amber-600/10"
                                        }`}
                                >
                                    <p className="font-medium text-sm mb-1 truncate w-full">{c.country}</p>
                                    <span className="text-3xl mb-1">{getCountryFlag(c.country)}</span>
                                    <p className="text-muted-foreground text-xs">{c.count} visitors</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                {data?.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="glass-card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Eye size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-display">{data.stats.totalVisits}</p>
                                <p className="text-sm text-muted-foreground">Total Visits</p>
                            </div>
                        </div>
                        <div className="glass-card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Globe size={20} className="text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-display">{data.stats.uniqueVisitors}</p>
                                <p className="text-sm text-muted-foreground">Unique Visitors</p>
                            </div>
                        </div>
                        <div className="glass-card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <TrendingUp size={20} className="text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-display">{data.stats.conversionRate}%</p>
                                <p className="text-sm text-muted-foreground">Subscribed</p>
                            </div>
                        </div>
                        <div className="glass-card p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <MessageSquare size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-display">{data.stats.messagesCount}</p>
                                <p className="text-sm text-muted-foreground">Messaged</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Visitors Table */}
                <div className="glass-card rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-500">
                            <Eye size={32} className="mx-auto mb-4 opacity-50" />
                            <p>{error}</p>
                        </div>
                    ) : !data?.visitors.length ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Eye size={32} className="mx-auto mb-4 opacity-50" />
                            <p>No visitors recorded</p>
                            <p className="text-sm mt-1">Visitors will appear here once tracking is active</p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                                <div className="col-span-3">Visitor ID</div>
                                <div className="col-span-3">Location</div>
                                <div className="col-span-2">Last Visit</div>
                                <div className="col-span-1">Visits</div>
                                <div className="col-span-3">Engagement</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-border">
                                {data.visitors.map((visitor, index) => (
                                    <div
                                        key={`${visitor.visitorHash}-${index}`}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Visitor Hash (truncated) */}
                                        <div className="col-span-3 flex items-center gap-2">
                                            <Globe size={14} className="text-muted-foreground hidden md:block" />
                                            <span className="font-mono text-sm text-muted-foreground">{visitor.visitorHash}</span>
                                        </div>

                                        {/* Location */}
                                        <div className="col-span-3 flex items-center gap-2">
                                            <span className="text-lg">{visitor.country ? getCountryFlag(visitor.country) : "🌍"}</span>
                                            <span className="text-sm">
                                                {visitor.city && visitor.country
                                                    ? `${visitor.city}, ${visitor.country}`
                                                    : visitor.country || "Unknown"}
                                            </span>
                                        </div>

                                        {/* Last Visit */}
                                        <div className="col-span-2 text-sm text-muted-foreground">
                                            {formatDate(visitor.lastVisit)}
                                        </div>

                                        {/* Visit Count */}
                                        <div className="col-span-1 text-sm font-medium">
                                            {visitor.visitCount}
                                        </div>

                                        {/* Engagement Badges */}
                                        <div className="col-span-3 flex items-center gap-2 flex-wrap">
                                            {visitor.isSubscriber && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                    <Users size={12} />
                                                    Subscriber
                                                </span>
                                            )}
                                            {visitor.hasMessaged && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                    <MessageSquare size={12} />
                                                    Messaged
                                                </span>
                                            )}
                                            {!visitor.isSubscriber && !visitor.hasMessaged && (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {data.pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, data.pagination.total)} of {data.pagination.total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="text-sm font-medium px-3">
                                            Page {page} of {data.pagination.totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                                            disabled={page === data.pagination.totalPages}
                                            className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">🔒 Privacy-Compliant Tracking:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>IP addresses are <strong>hashed</strong> using SHA-256 - raw IPs are never stored</li>
                        <li><span className="text-green-500">Subscriber</span> and <span className="text-blue-500">Messaged</span> status captured at visit time</li>
                        <li>Geolocation (country/city) is stored for analytics</li>
                        <li>Showing data for: <span className="font-medium text-foreground">{getPeriodLabel()}</span>
                            {country && <> in <span className="font-medium text-foreground">{country}</span></>}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
