"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative w-12 h-12 rounded-full glass flex items-center justify-center"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5 bg-muted-foreground/20 rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-12 h-12 rounded-full glass flex items-center justify-center group overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Sun Icon */}
      <Sun
        className={`absolute w-5 h-5 transition-all duration-500 ease-out ${
          theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
      {/* Moon Icon */}
      <Moon
        className={`absolute w-5 h-5 transition-all duration-500 ease-out ${
          theme === "dark"
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-coral/0 to-accent-peach/0 group-hover:from-accent-coral/10 group-hover:to-accent-peach/10 transition-all duration-300" />
    </button>
  );
}
