"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, ArrowLeft } from "lucide-react";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";
import { AnimatedLogoMark } from "@/components/layout/AnimatedLogoMark";

interface MobileSearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
  defaultExpanded?: boolean;
}

export function MobileSearchHeader({
  query,
  onQueryChange,
  onSearch,
  onClear,
  isLoading = false,
  defaultExpanded = false,
}: MobileSearchHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
        inputRef.current?.blur();
      }
    },
    [query, onSearch],
  );

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else {
      onQueryChange("");
    }

    inputRef.current?.focus();
  }, [onClear, onQueryChange]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    inputRef.current?.blur();
  }, []);

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
    <header className="sticky top-0 z-30 border-b border-foreground/10 bg-background lg:hidden">
      <div className="md:px-4 md:pt-3">
        {isExpanded ? (
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 border border-foreground/10 px-2 py-2"
            role="search"
          >
            <button
              type="button"
              onClick={handleCollapse}
              className="flex h-10 w-10 items-center justify-center text-foreground/70 active:bg-foreground/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
              aria-label="Close search"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search music"
                aria-label="Search music"
                disabled={isLoading}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full border-b-2 border-foreground bg-transparent py-2 text-base font-mono text-foreground placeholder-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:opacity-50"
              />

              {query && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-0 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="border border-foreground/10">
            <div className="grid grid-cols-[1fr_auto]">
              <div className="flex gap-2 items-center">
                <Link
                  href="/"
                  className="flex items-center gap-3  border-foreground/10 px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  aria-label="Go to homepage"
                >
                  <AnimatedLogoMark className="text-foreground" />

                  <div>
                    <h1 className="text-lg font-mono font-semibold uppercase  tracking-widest text-foreground">
                      SIDE A
                    </h1>
                    {/*<p className="text-[12px] font-mono uppercase tracking-widest text-foreground/60">
                      HI-FI SEARCH
                    </p>*/}
                  </div>
                </Link>
                <div className="pr-1">
                  <AuthStatusButton />
                </div>
              </div>

              <div className="flex items-center px-1">
                {/*<Link
                  href="/library"
                  className="flex h-10 w-10 items-center justify-center text-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  aria-label="Open library"
                >
                  <Library className="h-5 w-5" />
                </Link>
                <Link
                  href="/playlists"
                  className="flex h-10 w-10 items-center justify-center text-foreground/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  aria-label="Open playlists"
                >
                  <ListMusic className="h-5 w-5" />
                </Link>*/}
                <button
                  type="button"
                  onClick={handleExpand}
                  className="relative flex h-10 w-10 items-center justify-center text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-foreground" />
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden bg-foreground/10"
            aria-hidden="true"
          >
            <div className="h-full w-1/3 animate-[loading-line_1s_linear_infinite] bg-foreground" />
          </div>
        )}
      </div>
    </header>
  );
}
