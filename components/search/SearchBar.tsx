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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search for songs..."
          disabled={isLoading}
          className="w-full px-6 py-4 text-lg bg-walkman-dark/80 border-2 border-walkman-orange rounded-lg
                             text-walkman-yellow placeholder-walkman-yellow/50
                             focus:outline-none focus:border-walkman-yellow focus:bg-walkman-dark
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2
                             p-3 bg-walkman-orange hover:bg-walkman-yellow
                             text-walkman-dark rounded-md
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
