"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, ArrowLeft, ListMusic, Library } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";
import { AnimatedLogoMark } from "@/components/layout/AnimatedLogoMark";

interface MobileSearchHeaderProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

export function MobileSearchHeader({
  onSearch,
  isLoading = false,
  initialQuery = "",
}: MobileSearchHeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
        // Blur input after search on mobile
        inputRef.current?.blur();
      }
    },
    [query, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    inputRef.current?.focus();
  }, []);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    // Focus input after animation
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    inputRef.current?.blur();
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        handleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, handleCollapse]);

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="px-4 pt-3">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.form
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleSubmit}
              className="flex items-center gap-3 border border-foreground/10 px-2 py-2"
            >
              {/* Back button */}
              <button
                type="button"
                onClick={handleCollapse}
                className="w-10 h-10 flex items-center justify-center text-foreground/70 active:bg-foreground/10"
                aria-label="Close search"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Input container */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search music"
                  disabled={isLoading}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  className="w-full py-2 text-base font-mono
                           bg-transparent border-b-2 border-foreground
                           text-foreground placeholder-foreground/30
                           focus:outline-none
                           disabled:opacity-50"
                />

                {/* Clear button */}
                {query && !isLoading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-foreground/40"
                    aria-label="Clear search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="border border-foreground/10"
            >
              {/* Logo */}
              <div className="grid grid-cols-[1fr_auto]">
                <div className="flex items-center gap-3 px-3 py-3 border-r border-foreground/10">
                  <AnimatedLogoMark className="text-foreground" />

                  <div>
                    <h1 className="text-sm font-mono uppercase tracking-widest text-foreground leading-tight">
                      SIDE A
                    </h1>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                      HI-FI SEARCH
                    </p>
                  </div>
                </div>

                {/* Search button */}
                <div className="flex items-center px-1">
                  <div className="pr-1">
                    <AuthStatusButton />
                  </div>
                  <Link
                    href="/library"
                    className="w-10 h-10 flex items-center justify-center text-foreground/60 active:bg-foreground/10"
                    aria-label="Open library"
                  >
                    <Library className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/playlists"
                    className="w-10 h-10 flex items-center justify-center text-foreground/60 active:bg-foreground/10"
                    aria-label="Open playlists"
                  >
                    <ListMusic className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleExpand}
                    className="w-10 h-10 flex items-center justify-center text-foreground/60 active:bg-foreground/10"
                    aria-label="Open search"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground/10 overflow-hidden">
            <motion.div
              className="h-full bg-foreground w-1/3"
              animate={{ x: ["-100%", "400%"] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}
      </div>
    </header>
  );
}
