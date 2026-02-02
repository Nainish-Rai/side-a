"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative h-9 w-[4.5rem] border border-foreground bg-background transition-colors duration-200 hover:bg-foreground/[0.02]"
      aria-label="Toggle theme"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {/* Sliding indicator - Sharp corners, no rounding */}
      <div
        className={`absolute top-[3px] h-[calc(100%-6px)] w-[calc(50%-3px)] bg-foreground transition-all duration-200 ${
          theme === "light" ? "left-[3px]" : "left-[calc(50%)]"
        }`}
      >
        {/* Icon inside the slider */}
        <div className="h-full w-full flex items-center justify-center">
          {theme === "light" ? (
            <Sun className="w-3.5 h-3.5 text-background" strokeWidth={2} />
          ) : (
            <Moon className="w-3.5 h-3.5 text-background" strokeWidth={2} />
          )}
        </div>
      </div>

      {/* Background icons (decorative) */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <Sun
          className={`w-3.5 h-3.5 transition-opacity duration-200 ${
            theme === "light" ? "opacity-0" : "opacity-20"
          } text-foreground`}
          strokeWidth={2}
        />
        <Moon
          className={`w-3.5 h-3.5 transition-opacity duration-200 ${
            theme === "dark" ? "opacity-0" : "opacity-20"
          } text-foreground`}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}
