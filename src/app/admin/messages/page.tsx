"use client";

import { useState, useEffect, useCallback } from "react";
import {
    MessageSquare, RefreshCw, Loader2, Search, Filter, Eye,
    ChevronLeft, ChevronRight, Globe, Flag, Users, MailX,
    FileText, FileSpreadsheet
} from "lucide-react";
import { InfoBar } from "@/components/admin/info-bar";
import { MessagesList } from "@/components/admin/messages-list";
import { getCountryFlag } from "@/lib/country-utils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface Message {
    id: number;
    name: string;
    email: string;
    message: string;
    country: string | null;
    city: string | null;
    countryCode: string | null;
    createdAt: string;
    isRead: boolean;
    replied: boolean;
    replyText: string | null;
    repliedAt: string | null;
}

interface TopCountry {
    country: string;
    count: number;
}

interface MessagesResponse {
    success: boolean;
    messages: Message[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    stats: {
        total: number;
        unanswered: number;
        fromSubscribers: number;
    };
    topCountries: TopCountry[];
    availableCountries: string[];
    filter: string;
}

type FilterType = "all" | "unanswered" | "fromSubscribers";

export default function MessagesPage() {
    const [data, setData] = useState<MessagesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [country, setCountry] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
    const limit = 30;

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                filter,
                sort: sortBy,
            });
            if (search) params.set("search", search);
            if (country) params.set("country", country);

            const res = await fetch(`/api/admin/messages?${params}`);
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || "Failed to fetch messages");

            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch messages");
        } finally {
            setLoading(false);
        }
    }, [search, filter, country, sortBy, page]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchMessages();
    };

    // Server actions for toggle read and delete
    const toggleReadAction = async (formData: FormData) => {
        const id = parseInt(formData.get("id") as string);
        const isRead = formData.get("isRead") === "true";

        await fetch("/api/admin/messages/toggle-read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, isRead: !isRead }),
        });
        fetchMessages();
    };

    const deleteAction = async (formData: FormData) => {
        const id = parseInt(formData.get("id") as string);
        if (!confirm("Are you sure you want to delete this message?")) return;

        await fetch("/api/admin/messages/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        fetchMessages();
    };

    const markAllReadAction = async () => {
        await fetch("/api/admin/messages/mark-all-read", { method: "POST" });
        fetchMessages();
    };

    // Export to PDF
    const exportToPDF = async () => {
        setExporting("pdf");
        try {
            const params = new URLSearchParams({ filter });
            if (country) params.set("country", country);
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/messages/export?${params}`);
            const result = await res.json();

            if (!result.success) throw new Error("Export failed");

            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.text("Messages Report", 14, 22);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
            doc.text(`Filter: ${filter}, Country: ${country || "All"}`, 14, 36);
            doc.text(`Total: ${result.count} messages`, 14, 42);

            autoTable(doc, {
                startY: 50,
                head: [["Name", "Email", "Message", "Country", "Replied", "Date"]],
                body: result.data.map((m: any) => [
                    m.name,
                    m.email,
                    m.message,
                    m.country,
                    m.replied,
                    m.receivedAt,
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [232, 121, 94] },
            });

            doc.save(`messages_${new Date().toISOString().split("T")[0]}.pdf`);
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
            const params = new URLSearchParams({ filter });
            if (country) params.set("country", country);
            if (search) params.set("search", search);

            const res = await fetch(`/api/admin/messages/export?${params}`);
            const result = await res.json();

            if (!result.success) throw new Error("Export failed");

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Messages");

            worksheet.columns = [
                { header: "Name", key: "name", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Message", key: "message", width: 40 },
                { header: "Country", key: "country", width: 15 },
                { header: "City", key: "city", width: 15 },
                { header: "Replied", key: "replied", width: 10 },
                { header: "Reply", key: "replyText", width: 30 },
                { header: "Received", key: "receivedAt", width: 12 },
                { header: "Replied At", key: "repliedAt", width: 12 },
            ];

            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE8795E" },
            };

            result.data.forEach((m: any) => worksheet.addRow(m));

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `messages_${new Date().toISOString().split("T")[0]}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Excel export failed:", err);
            alert("Export failed");
        } finally {
            setExporting(null);
        }
    };

    const unreadCount = data?.messages.filter(m => !m.isRead).length || 0;

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* InfoBar */}
            <InfoBar counter={unreadCount > 0 ? `${unreadCount} unread` : undefined} />

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-10">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="font-display text-display-sm sm:text-display-md tracking-wider uppercase flex items-center gap-3">
                            <MessageSquare className="text-accent-coral" size={28} />
                            Messages
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {data?.stats ? `${data.stats.total} total • ${data.stats.unanswered} unanswered` : "Loading..."}
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
                            {exporting === "pdf" ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            disabled={exporting !== null || !data?.stats?.total}
                            className="btn-secondary flex items-center gap-2 text-sm px-3 py-2"
                            title="Export to Excel"
                        >
                            {exporting === "xlsx" ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllReadAction}
                                className="btn-secondary flex items-center gap-2 text-xs px-3 py-2 sm:text-sm"
                            >
                                <Eye size={14} />
                                <span className="hidden sm:inline">Mark All Read</span>
                            </button>
                        )}
                        <button
                            onClick={() => fetchMessages()}
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
                        {/* Total Messages */}
                        <button
                            onClick={() => { setFilter("all"); setPage(1); }}
                            className={`glass-card p-3 sm:p-5 text-left transition-all ${filter === "all"
                                ? "ring-2 ring-accent-coral shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 rounded-xl bg-accent-coral/10 w-fit">
                                    <MessageSquare size={20} className="text-accent-coral sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.total}</p>
                                </div>
                            </div>
                        </button>

                        {/* Unanswered */}
                        <button
                            onClick={() => { setFilter("unanswered"); setPage(1); }}
                            className={`glass-card p-3 sm:p-5 text-left transition-all ${filter === "unanswered"
                                ? "ring-2 ring-yellow-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 rounded-xl bg-yellow-500/10 w-fit">
                                    <MailX size={20} className="text-yellow-500 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Unanswered</p>
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.unanswered}</p>
                                </div>
                            </div>
                        </button>

                        {/* From Subscribers */}
                        <button
                            onClick={() => { setFilter("fromSubscribers"); setPage(1); }}
                            className={`glass-card p-3 sm:p-5 text-left transition-all ${filter === "fromSubscribers"
                                ? "ring-2 ring-green-500 shadow-lg"
                                : "hover:shadow-md"
                                }`}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                <div className="p-2 sm:p-3 rounded-xl bg-green-500/10 w-fit">
                                    <Users size={20} className="text-green-500 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Subscribers</p>
                                    <p className="text-lg sm:text-2xl font-display">{data.stats.fromSubscribers}</p>
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
                            <span className="font-medium text-sm">Top Countries</span>
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
                                    <p className="text-muted-foreground text-xs">{c.count} messages</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="glass-card p-3 sm:p-4 mb-6">
                    <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search messages..."
                                className="input-field pl-10 w-full text-sm"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                                className="input-field pr-8 text-sm flex-1 sm:flex-none"
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="name">By Name</option>
                                <option value="country">By Country</option>
                            </select>
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
                            <button type="submit" className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 py-2">
                                <Filter size={14} />
                                Apply
                            </button>
                        </div>
                    </form>
                </div>

                {/* Messages List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="glass-card py-20 text-center text-red-500">
                        <MessageSquare className="mx-auto mb-4" size={48} />
                        <p>{error}</p>
                    </div>
                ) : !data?.messages.length ? (
                    <div className="glass-card py-20 text-center text-muted-foreground">
                        <MessageSquare className="mx-auto mb-4" size={48} />
                        <p className="text-lg">No messages found</p>
                        <p className="text-sm mt-1">
                            {search || country || filter !== "all"
                                ? "Try adjusting your search or filters"
                                : "Messages from your contact form will appear here"}
                        </p>
                    </div>
                ) : (
                    <>
                        <MessagesList
                            messages={data.messages.map(m => ({
                                ...m,
                                createdAt: new Date(m.createdAt),
                                repliedAt: m.repliedAt ? new Date(m.repliedAt) : null,
                            }))}
                            toggleReadAction={toggleReadAction}
                            deleteAction={deleteAction}
                            onRefresh={fetchMessages}
                        />

                        {/* Pagination */}
                        {data.pagination.totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 glass-card px-4 py-3">
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
    );
}
