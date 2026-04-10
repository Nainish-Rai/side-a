"use client";

import { useCallback, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  submitHref?: string;
  isLoading?: boolean;
}

export function SearchBar({
  query,
  onQueryChange,
  onSearch,
  onClear,
  submitHref,
  isLoading = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onQueryChange(e.target.value);
    },
    [onQueryChange],
  );

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
      return;
    }

    onQueryChange("");
  }, [onClear, onQueryChange]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl" role="search">
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <Search
            className={`h-4 w-4 transition-colors duration-200 ${
              isFocused ? "text-foreground" : "text-foreground/40"
            }`}
          />
        </div>

        <input
          id="desktop-search"
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Search music"
          placeholder="Search music"
          disabled={isLoading}
          className={`w-full bg-transparent py-3 pl-11 pr-32 text-[15px] font-sans tracking-[-0.01em]
                     text-foreground placeholder-foreground/50 transition-colors duration-200
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2
                     disabled:cursor-not-allowed disabled:opacity-50
                     ${isFocused ? "border-foreground" : "border-foreground/20"}
                     hover:border-foreground/40`}
        />

        {query && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-24 top-1/2 -translate-y-1/2 text-foreground/60 transition-colors duration-200 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="submit"
          formAction={submitHref}
          disabled={isLoading || !query.trim()}
          className={`absolute right-0 top-1/2 -translate-y-1/2
                     border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em]
                     transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2
                     ${
                       query.trim() && !isLoading
                         ? "border-foreground bg-foreground text-background hover:opacity-90"
                         : "cursor-not-allowed border-foreground/20 bg-transparent text-foreground/30"
                     }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin border border-foreground/30 border-t-foreground" />
              SEARCHING
            </span>
          ) : (
            "SEARCH"
          )}
        </button>
      </div>
    </form>
  );
}
