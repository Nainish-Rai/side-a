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
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search for songs..."
          disabled={isLoading}
          className="w-full px-4 py-3 text-base bg-white border-2 border-black
                     text-black placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
                     transition-all duration-200 font-mono"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     px-4 py-2 bg-black hover:bg-gray-800
                     text-white text-xs font-mono uppercase tracking-wider
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black
                     transition-all duration-200"
        >
          {isLoading ? <span>...</span> : <Search className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}
