"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Trash2, Loader2, CheckCircle,
  User, Mail, Shield, Clock, AlertCircle, Eye, EyeOff, X
} from "lucide-react";
import { InfoBar } from "@/components/admin/info-bar";

interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function SystemUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add user form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          email: newEmail || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowAddForm(false);
        setNewUsername("");
        setNewPassword("");
        setNewEmail("");
      }, 1500);

      fetchUsers();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }

      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          isActive: !currentStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update user");
        return;
      }

      fetchUsers();
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      {/* InfoBar */}
      <InfoBar counter={`${users.length} users`} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-display-md tracking-wider uppercase">System Users</h1>
            <p className="text-muted-foreground mt-2">Manage admin accounts</p>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-coral hover:bg-accent-coral/90 text-white transition-colors"
          >
            <Plus size={18} />
            <span>Add User</span>
          </button>
        </div>

        {/* Add User Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="glass-card p-6 rounded-2xl w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl">Add New User</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 rounded-lg hover:bg-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {submitError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  User created successfully!
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Username *</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:border-accent-coral outline-none"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password *</label>
                  <div className="relative">
                    <Shield size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 rounded-lg bg-muted border border-border focus:border-accent-coral outline-none"
                      placeholder="Enter password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email (Optional)</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:border-accent-coral outline-none"
                      placeholder="Enter email"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting || !newUsername || !newPassword}
                    className="flex-1 py-3 rounded-lg bg-accent-coral hover:bg-accent-coral/90 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Create User
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
            <Users size={18} className="text-accent-coral" />
            <span className="font-medium">Admin Users</span>
            <span className="text-sm text-muted-foreground ml-auto">{users.length} users</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-500">
              <AlertCircle size={32} className="mx-auto mb-4" />
              <p>{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Users size={32} className="mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${!user.isActive ? "opacity-50" : ""
                    }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-accent-coral/10 flex items-center justify-center flex-shrink-0">
                    <User size={24} className="text-accent-coral" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-accent-coral/10 text-accent-coral">
                        {user.role}
                      </span>
                      {!user.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-500">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      {user.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {user.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Last login: {formatDate(user.lastLoginAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`p-2 rounded-lg transition-colors ${user.isActive
                        ? "hover:bg-yellow-500/10 text-yellow-500"
                        : "hover:bg-green-500/10 text-green-500"
                        }`}
                      title={user.isActive ? "Disable user" : "Enable user"}
                    >
                      {user.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">About System Users:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>All admin users can access the full dashboard</li>
            <li>Passwords are securely hashed with bcrypt</li>
            <li>Disabled users cannot log in until re-enabled</li>
            <li>You cannot delete your own account</li>
            <li>The last active admin account cannot be deleted</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
