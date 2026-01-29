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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <motion.div
        className="relative group"
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ willChange: "transform" }}
      >
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          <Search className={`w-5 h-5 transition-colors duration-200 ${
            isFocused ? "text-white/90" : "text-white/40"
          }`} />
        </div>

        {/* Input Field */}
        <motion.input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for songs, artists, or albums..."
          disabled={isLoading}
          className={`w-full pl-12 pr-24 py-3.5 text-base bg-white/10 backdrop-blur-xl border border-white/10
                     text-white placeholder-white/40
                     focus:outline-none focus:bg-white/[0.15] focus:border-white/20
                     disabled:opacity-50 disabled:cursor-not-allowed
                     rounded-full
                     transition-all duration-200
                     shadow-[0_4px_20px_rgba(0,0,0,0.1)]
                     hover:bg-white/[0.12]`}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {query && !isLoading && (
            <motion.button
              type="button"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              style={{ willChange: "opacity, transform" }}
              className="absolute right-16 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                       rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white
                       transition-all duration-150 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading || !query.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ willChange: "transform" }}
          className={`absolute right-2 top-1/2 -translate-y-1/2
                     px-5 py-2 rounded-full
                     text-sm font-medium
                     transition-all duration-200
                     flex items-center gap-2
                     ${query.trim() && !isLoading
                       ? "bg-white text-black hover:bg-white/90 shadow-lg"
                       : "bg-white/5 text-white/30 cursor-not-allowed"
                     }`}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </motion.button>
      </motion.div>
    </form>
  );
}
