"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, RefreshCw, Trash2, Loader2,
  CheckCircle, Activity, Info, AlertCircle, Filter,
  ChevronLeft, ChevronRight, User, Clock, FileText
} from "lucide-react";
import { InfoBar } from "@/components/admin/info-bar";

interface SystemLog {
  id: number;
  level: string;
  action: string;
  username: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
  user?: {
    id: number;
    username: string;
  } | null;
}

interface LogsResponse {
  logs: SystemLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    info: number;
    warn: number;
    error: number;
  };
}

export default function AdminLogsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Filters
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (levelFilter !== "all") params.append("level", levelFilter);
      if (actionFilter) params.append("action", actionFilter);

      const res = await fetch(`/api/admin/logs?${params}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to fetch logs");

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, [page, levelFilter, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearOld = async (days: number) => {
    if (!confirm(`Clear all logs older than ${days} days?`)) return;

    setClearing(true);
    try {
      const res = await fetch(`/api/admin/logs?daysOld=${days}`, { method: "DELETE" });
      if (res.ok) {
        setClearSuccess(true);
        setTimeout(() => setClearSuccess(false), 2000);
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to clear logs:", err);
    } finally {
      setClearing(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR": return <AlertCircle size={16} className="text-red-500" />;
      case "WARN": return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case "ERROR": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "WARN": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action: string) => {
    if (action.includes("DELETE")) return "text-red-500";
    if (action.includes("CREATE")) return "text-green-500";
    if (action.includes("UPDATE") || action.includes("TOGGLE")) return "text-blue-500";
    if (action.includes("LOGIN")) return "text-purple-500";
    if (action.includes("LOGOUT")) return "text-orange-500";
    return "text-foreground";
  };

  return (
    <div className="min-h-screen">
      {/* InfoBar */}
      <InfoBar counter={data?.total ? `${data.total} logs` : undefined} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-display-md tracking-wider uppercase">System Logs</h1>
            <p className="text-muted-foreground mt-2">Audit trail of all admin actions</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <div className="relative">
              <button
                onClick={() => handleClearOld(30)}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50"
              >
                {clearing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : clearSuccess ? (
                  <CheckCircle size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                <span className="hidden sm:inline">Clear 30+ days</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Info size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-display">{data.stats.info}</p>
                <p className="text-sm text-muted-foreground">Info</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-display">{data.stats.warn}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-display">{data.stats.error}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <select
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
            >
              <option value="all">All Levels</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warning</option>
              <option value="ERROR">Error</option>
            </select>

            <input
              type="text"
              placeholder="Filter by action..."
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm min-w-[200px]"
            />

            {(levelFilter !== "all" || actionFilter) && (
              <button
                onClick={() => { setLevelFilter("all"); setActionFilter(""); setPage(1); }}
                className="text-sm text-accent-coral hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Logs Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <AlertTriangle size={32} className="mx-auto mb-4" />
              <p>{error}</p>
            </div>
          ) : !data?.logs.length ? (
            <div className="text-center py-20 text-muted-foreground">
              <FileText size={32} className="mx-auto mb-4 opacity-50" />
              <p>No logs found</p>
              <p className="text-sm mt-1">Logs will appear here when admin actions occur</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Timestamp</div>
                <div className="col-span-1">Level</div>
                <div className="col-span-2">User</div>
                <div className="col-span-2">Action</div>
                <div className="col-span-5">Details</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-border">
                {data.logs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Timestamp */}
                    <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock size={14} className="hidden md:block" />
                      <span className="font-mono text-xs md:text-sm">{formatDate(log.timestamp)}</span>
                    </div>

                    {/* Level */}
                    <div className="col-span-1 flex items-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getLevelBadgeClass(log.level)}`}>
                        {getLevelIcon(log.level)}
                        <span className="hidden sm:inline">{log.level}</span>
                      </span>
                    </div>

                    {/* User */}
                    <div className="col-span-2 flex items-center gap-2">
                      <User size={14} className="text-muted-foreground" />
                      <span className="font-medium text-sm">{log.username}</span>
                    </div>

                    {/* Action */}
                    <div className="col-span-2">
                      <span className={`font-mono text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="col-span-5 text-sm text-muted-foreground">
                      {log.details || "-"}
                      {log.ipAddress && (
                        <span className="ml-2 text-xs opacity-60">
                          ({log.ipAddress})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, data.total)} of {data.total}
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
                      Page {page} of {data.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
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
          <p className="font-medium text-foreground mb-2">About System Logs:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All admin actions are automatically logged to the database</li>
            <li><span className="text-blue-500">INFO</span> - Normal operations (login, updates, creates)</li>
            <li><span className="text-yellow-500">WARN</span> - Failed login attempts, unusual activity</li>
            <li><span className="text-red-500">ERROR</span> - System errors and failures</li>
            <li>Logs older than 90 days are recommended to be cleared periodically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
