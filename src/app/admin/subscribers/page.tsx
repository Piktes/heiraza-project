"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, UserCheck, UserMinus, RefreshCw, Loader2, Search,
    Filter, ChevronLeft, ChevronRight, Globe, Flag, Trash2, Mail, Bell,
    Download, FileText, FileSpreadsheet, MessageSquare
} from "lucide-react";
import { InfoBar } from "@/components/admin/info-bar";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

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
    "Türkiye": "🇹🇷",
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

function getCountryFlag(country: string | null): string {
    if (!country) return "🌍";
    return countryToFlag[country] || "🌍";
}

interface Subscriber {
    id: number;
    email: string;
    receiveEventAlerts: boolean;
    isActive: boolean;
    joinedAt: string;
    country: string | null;
    city: string | null;
    countryCode: string | null;
    unsubscribeReason: string | null;
    unsubscribedAt: string | null;
}

interface TopCountry {
    country: string;
    count: number;
}

interface UnsubscribeReasonStat {
    reason: string;
    count: number;
}

interface SubscribersResponse {
    subscribers: Subscriber[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        total: number;
        eventFans: number;
        unsubscribed: number;
    };
    topCountries: TopCountry[];
    availableCountries: string[];
    countryFilter: string | null;
    statusFilter: string;
    unsubscribeReasonStats: UnsubscribeReasonStat[];
}

type TopCountriesMode = "total" | "eventFans" | "unsubscribed";

export default function SubscribersPage() {
    const [data, setData] = useState<SubscribersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [country, setCountry] = useState<string>("");
    const [status, setStatus] = useState<string>("all");
    const [search, setSearch] = useState<string>("");
    const [page, setPage] = useState(1);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [topCountriesMode, setTopCountriesMode] = useState<TopCountriesMode>("total");
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
    const limit = 30;

    const fetchSubscribers = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                status,
                topCountriesMode,
            });
            if (country) params.set("country", country);
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/subscribers?${params}`);
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Failed to fetch subscribers");

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch subscribers");
        } finally {
            setLoading(false);
        }
    }, [country, status, search, page, topCountriesMode]);

    useEffect(() => {
        fetchSubscribers();
    }, [fetchSubscribers]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this subscriber?")) return;

        setDeleting(id);
        try {
            const formData = new FormData();
            formData.set("id", id.toString());

            const res = await fetch("/api/admin/subscribers/delete", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                fetchSubscribers();
            }
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchSubscribers();
    };

    // Export to PDF
    const exportToPDF = async () => {
        setExporting("pdf");
        try {
            const params = new URLSearchParams({ status });
            if (country) params.set("country", country);
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/subscribers/export?${params}`);
            const result = await res.json();

            if (!result.success) throw new Error("Export failed");

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Subscribers Report", 14, 22);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Filters: Status=${status}, Country=${country || "All"}, Search=${search || "None"}`, 14, 36);
            doc.text(`Total: ${result.count} subscribers`, 14, 42);

            autoTable(doc, {
                startY: 50,
                head: [["Email", "Country", "City", "Status", "Events", "Joined"]],
                body: result.data.map((s: any) => [
                    s.email,
                    s.country,
                    s.city,
                    s.status,
                    s.eventAlerts,
                    s.joinedAt,
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [232, 121, 94] },
            });

            doc.save(`subscribers_${new Date().toISOString().split("T")[0]}.pdf`);
        } catch (err) {
            console.error("PDF export failed:", err);
            alert("Export failed");
        } finally {
            setExporting(null);
        }
    };

    // Export to Excel
    const exportToExcel = async () => {
        setExporting("xlsx");
        try {
            const params = new URLSearchParams({ status });
            if (country) params.set("country", country);
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/subscribers/export?${params}`);
            const result = await res.json();

            if (!result.success) throw new Error("Export failed");

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Subscribers");

            worksheet.columns = [
                { header: "Email", key: "email", width: 35 },
                { header: "Country", key: "country", width: 20 },
                { header: "City", key: "city", width: 20 },
                { header: "Status", key: "status", width: 15 },
                { header: "Event Alerts", key: "eventAlerts", width: 12 },
                { header: "Joined", key: "joinedAt", width: 15 },
                { header: "Unsubscribed", key: "unsubscribedAt", width: 15 },
                { header: "Reason", key: "unsubscribeReason", width: 30 },
            ];

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8795E" },
            };

            result.data.forEach((s: any) => worksheet.addRow(s));

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `subscribers_${new Date().toISOString().split("T")[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Excel export failed:", err);
            alert("Export failed");
        } finally {
            setExporting(null);
        }
    };

    const activeCount = data?.stats ? data.stats.total - data.stats.unsubscribed : 0;

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* InfoBar */}
            <InfoBar counter={data?.stats ? `${activeCount}/${data.stats.total} active` : undefined} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-display text-display-md tracking-wider uppercase flex items-center gap-3">
                            <Users className="text-accent-coral" size={28} />
                            Subscribers
                        </h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Manage your newsletter subscribers and view analytics.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Export Buttons */}
                        <button
                            onClick={exportToPDF}
                            disabled={exporting !== null || !data?.stats?.total}
                            className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                            title="Export to PDF"
                        >
                            {exporting === "pdf" ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <FileText size={16} />
                            )}
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={exporting !== null || !data?.stats?.total}
                            className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                            title="Export to Excel"
                        >
                            {exporting === "xlsx" ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <FileSpreadsheet size={16} />
                            )}
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button
                            onClick={() => fetchSubscribers()}
                            disabled={loading}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards - Clickable */}
                {data?.stats && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                        {/* Total Subscribers */}
                        <button
                            onClick={() => setTopCountriesMode("total")}
                            className={`glass-card p-3 sm:p-5 text-left transition-all ${topCountriesMode === "total"
                                ? "ring-2 ring-accent-coral shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 rounded-xl bg-accent-coral/10 w-fit">
                                    <Users size={20} className="text-accent-coral sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.total}</p>
                                </div>
                            </div>
                        </button>

                        {/* Event Fans */}
                        <button
                            onClick={() => setTopCountriesMode("eventFans")}
                            className={`glass-card p-3 sm:p-5 text-left transition-all ${topCountriesMode === "eventFans"
                                ? "ring-2 ring-green-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 rounded-xl bg-green-500/10 w-fit">
                                    <UserCheck size={20} className="text-green-500 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Event Fans</p>
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.eventFans}</p>
                                </div>
                            </div>
                        </button>

                        {/* Unsubscribed */}
                        <button
                            onClick={() => setTopCountriesMode("unsubscribed")}
                            className={`glass-card p-3 sm:p-5 text-left transition-all ${topCountriesMode === "unsubscribed"
                                ? "ring-2 ring-red-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 rounded-xl bg-red-500/10 w-fit">
                                    <UserMinus size={20} className="text-red-500 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Unsub</p>
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.unsubscribed}</p>
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Top 3 Countries Widget */}
                {data?.topCountries && data.topCountries.length > 0 && (
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Flag size={16} className="text-accent-coral" />
                            <span className="font-medium text-sm">
                                Top Countries
                                <span className="text-muted-foreground ml-2 text-xs">
                                    ({topCountriesMode === "total" ? "All" : topCountriesMode === "eventFans" ? "Event Fans" : "Unsubscribed"})
                                </span>
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {data.topCountries.map((c, idx) => (
                                <div
                                    key={c.country}
                                    className={`flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl ${idx === 0 ? "bg-yellow-500/10" :
                                        idx === 1 ? "bg-gray-500/10" :
                                            "bg-amber-600/10"
                                        }`}
                                >
                                    <span className="text-2xl sm:text-3xl mb-1">{getCountryFlag(c.country)}</span>
                                    <p className="font-medium text-xs sm:text-sm truncate w-full">{c.country}</p>
                                    <p className="text-muted-foreground text-xs">{c.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Unsubscribe Reasons Breakdown */}
                {data?.unsubscribeReasonStats && data.unsubscribeReasonStats.length > 0 && (
                    <div className="glass-card p-4 mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare size={16} className="text-red-500" />
                            <span className="font-medium text-sm">
                                Why Users Unsubscribe
                                <span className="text-muted-foreground ml-2 text-xs">
                                    ({data.stats.unsubscribed} total)
                                </span>
                            </span>
                        </div>
                        <div className="space-y-2">
                            {data.unsubscribeReasonStats.slice(0, 5).map((item, idx) => {
                                const percentage = data.stats.unsubscribed > 0
                                    ? Math.round((item.count / data.stats.unsubscribed) * 100)
                                    : 0;
                                return (
                                    <div key={item.reason} className="relative">
                                        <div
                                            className="absolute inset-0 rounded-lg bg-red-500/10"
                                            style={{ width: `${percentage}%` }}
                                        />
                                        <div className="relative flex items-center justify-between p-2 rounded-lg">
                                            <span className="text-sm truncate flex-1" title={item.reason}>
                                                {item.reason === "Other" ? "📝 Other (custom)" : item.reason}
                                            </span>
                                            <div className="flex items-center gap-2 ml-2 text-sm">
                                                <span className="text-muted-foreground">{item.count}</span>
                                                <span className="text-xs text-red-500 font-medium w-10 text-right">
                                                    {percentage}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px] relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search email, location..."
                                className="input-field pl-10 w-full"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Status Filter */}
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-muted-foreground hidden sm:block" />
                                <select
                                    value={status}
                                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                                    className="px-3 py-2 rounded-lg bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-accent-coral/20"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="unsubscribed">Unsubscribed</option>
                                </select>
                            </div>

                            {/* Country Filter */}
                            <div className="flex items-center gap-2">
                                <Globe size={16} className="text-muted-foreground hidden sm:block" />
                                <select
                                    value={country}
                                    onChange={(e) => { setCountry(e.target.value); setPage(1); }}
                                    className="px-3 py-2 rounded-lg bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-accent-coral/20 max-w-[140px]"
                                >
                                    <option value="">All Countries</option>
                                    {data?.availableCountries?.map((c) => (
                                        <option key={c} value={c}>
                                            {getCountryFlag(c)} {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" className="btn-primary flex items-center gap-2 px-4 py-2">
                                <Filter size={16} />
                                Apply
                            </button>
                        </div>
                    </form>
                </div>

                {/* Subscribers Table */}
                <div className="glass-card rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={32} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-500">
                            <Users size={32} className="mx-auto mb-4 opacity-50" />
                            <p>{error}</p>
                        </div>
                    ) : !data?.subscribers.length ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Users size={32} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No subscribers found</p>
                            <p className="text-sm mt-1">
                                {search || country || status !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "Subscribers will appear here when users sign up"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header - Desktop only */}
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                                <div className="col-span-4">Email</div>
                                <div className="col-span-2">Location</div>
                                <div className="col-span-2">Joined</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {/* Table Body */}
                            <div className="divide-y divide-border">
                                {data.subscribers.map((subscriber) => (
                                    <div
                                        key={subscriber.id}
                                        className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Email */}
                                        <div className="md:col-span-4 flex items-center gap-2">
                                            <Mail size={14} className="text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm truncate">{subscriber.email}</span>
                                        </div>

                                        {/* Location */}
                                        <div className="md:col-span-2 flex items-center gap-2">
                                            <span className="text-lg">{getCountryFlag(subscriber.country)}</span>
                                            <span className="text-sm text-muted-foreground truncate">
                                                {subscriber.city && subscriber.country
                                                    ? `${subscriber.city}, ${subscriber.country}`
                                                    : subscriber.country || "Unknown"}
                                            </span>
                                        </div>

                                        {/* Joined Date */}
                                        <div className="md:col-span-2 text-sm text-muted-foreground">
                                            {formatDate(subscriber.joinedAt)}
                                        </div>

                                        {/* Status Badges */}
                                        <div className="md:col-span-2 flex items-center gap-2 flex-wrap">
                                            {subscriber.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                                                    Unsub
                                                </span>
                                            )}
                                            {subscriber.receiveEventAlerts && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                    <Bell size={10} />
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(subscriber.id)}
                                                disabled={deleting === subscriber.id}
                                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                                title="Delete subscriber"
                                            >
                                                {deleting === subscriber.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {data.pagination.totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/30">
                                    <p className="text-sm text-muted-foreground">
                                        {((page - 1) * limit) + 1} - {Math.min(page * limit, data.pagination.total)} of {data.pagination.total}
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
                                            {page} / {data.pagination.totalPages}
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
            </div>
        </div>
    );
}
