"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 1000 * 60 * 5,
            // Cache persists for 30 minutes
            gcTime: 1000 * 60 * 30,
            // Upstream API clients already retry; avoid doubling latency in React Query
            retry: 0,
            // Don't refetch on window focus by default
            refetchOnWindowFocus: false,
            // Don't refetch on mount if data is available
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
