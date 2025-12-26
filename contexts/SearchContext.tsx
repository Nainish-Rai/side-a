"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type SearchContentType = "tracks" | "albums" | "artists" | "playlists";

interface SearchContextValue {
  query: string;
  currentTab: SearchContentType;
  setQuery: (query: string) => void;
  setCurrentTab: (tab: SearchContentType) => void;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [currentTab, setCurrentTab] = useState<SearchContentType>("tracks");

  return (
    <SearchContext.Provider
      value={{
        query,
        currentTab,
        setQuery,
        setCurrentTab,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchContext must be used within SearchProvider");
  }
  return context;
}
