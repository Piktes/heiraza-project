"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Eye, RefreshCw, Loader2, Users, MessageSquare,
    TrendingUp, Filter, ChevronLeft, ChevronRight, Globe, Flag,
    FileText, FileSpreadsheet
} from "lucide-react";
import { InfoBar } from "@/components/admin/info-bar";
import { getCountryFlag } from "@/lib/country-utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

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
    engagementFilter: string;
}

type EngagementFilter = "all" | "subscribers" | "messaged";

export default function AdminVisitorsPage() {
    const [data, setData] = useState<VisitorsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("week");
    const [country, setCountry] = useState<string>("");
    const [page, setPage] = useState(1);
    const [engagementFilter, setEngagementFilter] = useState<EngagementFilter>("all");
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
    const limit = 30;

    const fetchVisitors = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                period,
                page: page.toString(),
                limit: limit.toString(),
                engagement: engagementFilter,
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
    }, [period, country, page, engagementFilter]);

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

    // Export to PDF
    const exportToPDF = async () => {
        setExporting("pdf");
        try {
            const params = new URLSearchParams({ period, engagement: engagementFilter });
            if (country) params.set("country", country);

            const res = await fetch(`/api/admin/visitors/export?${params}`);
            const result = await res.json();

            if (!result.success) throw new Error("Export failed");

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Visitors Report", 14, 22);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Period: ${result.filters.period}, Country: ${country || "All"}, Filter: ${engagementFilter}`, 14, 36);
            doc.text(`Total: ${result.count} visitors`, 14, 42);

            autoTable(doc, {
                startY: 50,
                head: [["Visitor ID", "Country", "City", "Last Visit", "Visits", "Subscriber", "Messaged"]],
                body: result.data.map((v: any) => [
                    v.visitorId,
                    v.country,
                    v.city,
                    v.lastVisit,
                    v.visits,
                    v.isSubscriber,
                    v.hasMessaged,
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [232, 121, 94] },
            });

            doc.save(`visitors_${new Date().toISOString().split("T")[0]}.pdf`);
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
            const params = new URLSearchParams({ period, engagement: engagementFilter });
            if (country) params.set("country", country);

            const res = await fetch(`/api/admin/visitors/export?${params}`);
            const result = await res.json();

            if (!result.success) throw new Error("Export failed");

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Visitors");

            worksheet.columns = [
                { header: "Visitor ID", key: "visitorId", width: 20 },
                { header: "Country", key: "country", width: 20 },
                { header: "City", key: "city", width: 20 },
                { header: "Last Visit", key: "lastVisit", width: 15 },
                { header: "Visits", key: "visits", width: 10 },
                { header: "Subscriber", key: "isSubscriber", width: 12 },
                { header: "Messaged", key: "hasMessaged", width: 12 },
            ];

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8795E" },
            };

            result.data.forEach((v: any) => worksheet.addRow(v));

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `visitors_${new Date().toISOString().split("T")[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Excel export failed:", err);
            alert("Export failed");
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* InfoBar */}
            <InfoBar counter={data?.stats ? `${data.stats.uniqueVisitors} unique visitors` : undefined} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-display text-display-md tracking-wider uppercase">Visitors</h1>
                        <p className="text-muted-foreground mt-2 text-sm">Privacy-compliant visitor analytics</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Export Buttons */}
                        <button
                            onClick={exportToPDF}
                            disabled={exporting !== null || !data?.stats?.totalVisits}
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
                            disabled={exporting !== null || !data?.stats?.totalVisits}
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
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
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
                                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${period === p
                                        ? "bg-accent-coral text-white"
                                        : "bg-muted hover:bg-muted/80"
                                        }`}
                                >
                                    {p === "today" ? "Today" : p === "week" ? "Weekly" : p === "month" ? "Monthly" : "Yearly"}
                                </button>
                            ))}
                        </div>

                        {/* Country Filter */}
                        <div className="flex items-center gap-2 sm:ml-auto">
                            <Globe size={16} className="text-muted-foreground" />
                            <select
                                value={country}
                                onChange={(e) => { setCountry(e.target.value); setPage(1); }}
                                className="px-3 py-2 rounded-lg bg-muted border-none text-sm font-medium focus:ring-2 focus:ring-accent-coral/20 max-w-[160px]"
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
                            <span className="font-medium text-sm">
                                Top Countries
                                <span className="text-muted-foreground ml-2 text-xs">
                                    ({engagementFilter === "all" ? "All" : engagementFilter === "subscribers" ? "Subscribers" : "Messaged"})
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
                                    <p className="text-muted-foreground text-xs">{c.count} visitors</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Stats Cards - Clickable */}
                {data?.stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
                        {/* Total Visits */}
                        <button
                            onClick={() => { setEngagementFilter("all"); setPage(1); }}
                            className={`glass-card p-3 sm:p-4 text-left transition-all ${engagementFilter === "all"
                                ? "ring-2 ring-blue-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Eye size={16} className="text-blue-500 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.totalVisits}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Visits</p>
                                </div>
                            </div>
                        </button>

                        {/* Unique Visitors */}
                        <div className="glass-card p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <Globe size={16} className="text-purple-500 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.uniqueVisitors}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Unique</p>
                                </div>
                            </div>
                        </div>

                        {/* Subscribers */}
                        <button
                            onClick={() => { setEngagementFilter("subscribers"); setPage(1); }}
                            className={`glass-card p-3 sm:p-4 text-left transition-all ${engagementFilter === "subscribers"
                                ? "ring-2 ring-green-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                    <TrendingUp size={16} className="text-green-500 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.conversionRate}%</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Subscribed</p>
                                </div>
                            </div>
                        </button>

                        {/* Messaged */}
                        <button
                            onClick={() => { setEngagementFilter("messaged"); setPage(1); }}
                            className={`glass-card p-3 sm:p-4 text-left transition-all ${engagementFilter === "messaged"
                                ? "ring-2 ring-orange-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                    <MessageSquare size={16} className="text-orange-500 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.messagesCount}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Messaged</p>
                                </div>
                            </div>
                        </button>
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
                            <p className="text-lg">No visitors found</p>
                            <p className="text-sm mt-1">
                                {country || engagementFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Visitors will appear here once tracking is active"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table Header - Desktop only */}
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
                                        className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Visitor Hash */}
                                        <div className="md:col-span-3 flex items-center gap-2">
                                            <Globe size={14} className="text-muted-foreground flex-shrink-0" />
                                            <span className="font-mono text-sm text-muted-foreground truncate">{visitor.visitorHash}</span>
                                        </div>

                                        {/* Location */}
                                        <div className="md:col-span-3 flex items-center gap-2">
                                            <span className="text-lg">{getCountryFlag(visitor.country)}</span>
                                            <span className="text-sm truncate">
                                                {visitor.city && visitor.country
                                                    ? `${visitor.city}, ${visitor.country}`
                                                    : visitor.country || "Unknown"}
                                            </span>
                                        </div>

                                        {/* Last Visit */}
                                        <div className="md:col-span-2 text-sm text-muted-foreground">
                                            {formatDate(visitor.lastVisit)}
                                        </div>

                                        {/* Visit Count */}
                                        <div className="md:col-span-1 text-sm font-medium">
                                            {visitor.visitCount}
                                        </div>

                                        {/* Engagement Badges */}
                                        <div className="md:col-span-3 flex items-center gap-2 flex-wrap">
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

                {/* Info Box */}
                <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-2">🔒 Privacy-Compliant Tracking:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>IP addresses are <strong>hashed</strong> using SHA-256 - raw IPs are never stored</li>
                        <li><span className="text-green-500">Subscriber</span> and <span className="text-blue-500">Messaged</span> status captured at visit time</li>
                        <li>Geolocation (country/city) is stored for analytics</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
