"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, ListMusic, Search } from "lucide-react";
import { AnimatedLogoMark } from "@/components/layout/AnimatedLogoMark";
import { SearchBar } from "@/components/search/SearchBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthStatusButton } from "@/components/auth/AuthStatusButton";
import { useSearchContext } from "@/contexts/SearchContext";

const NAV_TABS = [
  { href: "/", label: "SEARCH", icon: Search, exact: true },
  { href: "/library", label: "LIBRARY", icon: Library, exact: false },
  { href: "/playlists", label: "PLAYLISTS", icon: ListMusic, exact: false },
] as const;

export function DesktopHeader() {
  const pathname = usePathname();
  const { handleSearch, query, setQuery } = useSearchContext();

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const isSearchPage = pathname === "/";

  return (
    <header className="sticky top-0 z-30 hidden border-foreground/10 bg-background lg:block">
      <div className="mx-auto max-w-6xl px-6 pt-4">
        <div className="border border-foreground/10">
          <div className="grid grid-cols-[220px_auto_minmax(300px,1fr)_auto] items-center">
            {/* Logo */}
            <div className="flex h-full items-center border-r border-foreground/10 px-5">
              <Link
                href="/"
                className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
                aria-label="Go to homepage"
              >
                <AnimatedLogoMark className="text-foreground" />
                <div>
                  <h1 className="text-base font-mono uppercase leading-tight tracking-[0.2em] text-foreground">
                    SIDE A
                  </h1>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/70">
                    HI-FI SEARCH
                  </p>
                </div>
              </Link>
            </div>

            {/* Nav tabs */}
            <div className="flex h-full items-center border-r border-foreground/10 px-5">
              <div className="flex items-center gap-6">
                {NAV_TABS.map(({ href, label, icon: Icon, exact }) => {
                  const active = isActive(href, exact);
                  return active ? (
                    <span
                      key={href}
                      className="relative inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </span>
                  ) : (
                    <Link
                      key={href}
                      href={href}
                      className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-foreground/65 transition-colors hover:text-foreground/85"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Search bar (only on search page) or spacer */}
            <div className="min-w-0 border-r border-foreground/10 px-5">
              {isSearchPage ? (
                <SearchBar
                  query={query}
                  onQueryChange={setQuery}
                  onSearch={handleSearch}
                  isLoading={false}
                />
              ) : (
                <div className="h-[52px]" />
              )}
            </div>

            {/* Auth + Theme */}
            <div className="px-5 py-4">
              <div className="flex h-full items-center gap-4">
                <AuthStatusButton />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
