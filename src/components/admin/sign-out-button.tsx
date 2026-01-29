"use client";

import { signOut } from "next-auth/react";
import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";

interface SignOutButtonProps {
  className?: string;
  showText?: boolean;
}

export function SignOutButton({ className = "", showText = true }: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/admin/login" });
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors disabled:opacity-50 ${className}`}
      title="Sign Out"
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <LogOut size={16} />
      )}
      {showText && <span className="text-sm font-medium">Sign Out</span>}
    </button>
  );
}
