"use client";

import { useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  isCompact?: boolean;
}

export function SearchBar({
  onSearch,
  isLoading = false,
  isCompact = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    },
    [query, onSearch]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
  }, []);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="relative group">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Search className={`w-4 h-4 transition-colors duration-200 ${
            isFocused ? "text-white" : "text-white/40"
          }`} />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="SEARCH MUSIC"
          disabled={isLoading}
          className={`w-full pl-11 pr-32 py-3 text-sm font-mono uppercase tracking-wider
                     bg-transparent border-b-2 transition-colors duration-200
                     text-white placeholder-white/30
                     focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${isFocused ? "border-white" : "border-white/20"}
                     hover:border-white/40`}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query && !isLoading && (
            <motion.button
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute right-24 top-1/2 -translate-y-1/2
                       text-white/40 hover:text-white
                       transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className={`absolute right-0 top-1/2 -translate-y-1/2
                     px-4 py-1.5 border
                     text-[10px] font-mono uppercase tracking-widest
                     transition-all duration-200
                     ${query.trim() && !isLoading
                       ? "bg-white text-black border-white hover:bg-white/90"
                       : "bg-transparent text-white/30 border-white/20 cursor-not-allowed"
                     }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 border border-white/30 border-t-white animate-spin" />
              <span>SEARCHING</span>
            </span>
          ) : (
            <span>SEARCH</span>
          )}
        </button>
      </div>
    </form>
  );
}
