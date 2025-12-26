"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative h-10 w-20 border border-carbon dark:border-bone bg-white dark:bg-carbon transition-colors duration-300"
      aria-label="Toggle theme"
    >
      {/* Sliding indicator */}
      <div
        className={`absolute top-1 h-7 w-9 bg-carbon dark:bg-bone transition-all duration-300 ${
          theme === "light" ? "left-1" : "left-[calc(100%-2.375rem)]"
        }`}
      >
        {/* Icon inside the slider */}
        <div className="h-full w-full flex items-center justify-center">
          {theme === "light" ? (
            <Sun className="w-4 h-4 text-white" />
          ) : (
            <Moon className="w-4 h-4 text-carbon" />
          )}
        </div>
      </div>

      {/* Background icons (decorative) */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <Sun
          className={`w-4 h-4 transition-opacity ${
            theme === "light" ? "opacity-0" : "opacity-30"
          } text-carbon dark:text-bone`}
        />
        <Moon
          className={`w-4 h-4 transition-opacity ${
            theme === "dark" ? "opacity-0" : "opacity-30"
          } text-carbon dark:text-bone`}
        />
      </div>
    </button>
  );
}
