"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
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

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <motion.input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Enter song, artist, or album..."
          disabled={isLoading}
          animate={{
            paddingTop: isCompact ? "0.5rem" : "0.75rem",
            paddingBottom: isCompact ? "0.5rem" : "0.75rem",
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={`w-full px-4 pr-20 text-base bg-white dark:bg-[#1a1a1a] border border-carbon dark:border-bone
                     text-carbon dark:text-bone placeholder-gray-400 dark:placeholder-gray-600 font-mono
                     focus:outline-none focus:ring-0 focus:border-walkman-orange
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-[#0a0a0a]
                     shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]
                     hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.08)]`}
        />
        <motion.button
          type="submit"
          disabled={isLoading || !query.trim()}
          animate={{
            paddingTop: isCompact ? "0.25rem" : "0.375rem",
            paddingBottom: isCompact ? "0.25rem" : "0.375rem",
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2
                     px-4 bg-carbon dark:bg-bone hover:bg-walkman-orange dark:hover:bg-walkman-orange
                     text-white dark:text-carbon hover:text-white dark:hover:text-carbon
                     text-[9px] font-mono uppercase tracking-widest
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-carbon dark:disabled:hover:bg-bone
                     border border-carbon dark:border-bone
                     shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[2px_2px_0px_0px_rgba(242,239,233,0.3)]
                     hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)] dark:hover:shadow-[1px_1px_0px_0px_rgba(242,239,233,0.3)]
                     active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                     flex items-center gap-1.5`}
        >
          {isLoading ? (
            <span className="inline-block w-3 h-3 border border-white dark:border-carbon border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <motion.div
                animate={{
                  width: isCompact ? "0.625rem" : "0.75rem",
                  height: isCompact ? "0.625rem" : "0.75rem",
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <Search className="w-full h-full" />
              </motion.div>
              <AnimatePresence mode="wait">
                {!isCompact && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{
                      duration: 0.2,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    Search
                  </motion.span>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
