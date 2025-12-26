"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
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
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Enter song, artist, or album..."
          disabled={isLoading}
          className="w-full px-4 py-3 pr-20 text-base bg-white border border-carbon
                     text-carbon placeholder-gray-400 font-mono
                     focus:outline-none focus:ring-0 focus:border-walkman-orange
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
                     transition-all duration-200
                     shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]
                     hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2
                     px-4 py-1.5 bg-carbon hover:bg-walkman-orange
                     text-white text-[9px] font-mono uppercase tracking-widest
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-carbon
                     transition-all duration-200
                     border border-carbon
                     shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]
                     hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.3)]
                     active:shadow-none active:translate-x-[1px] active:translate-y-[1px]
                     flex items-center gap-1.5"
        >
          {isLoading ? (
            <span className="inline-block w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Search className="w-3 h-3" />
              <span>Search</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
