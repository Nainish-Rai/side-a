"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Library, Settings } from "lucide-react";
import { ComponentType } from "react";

interface Tab {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  href: string;
}

const tabs: Tab[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "library", label: "Library", icon: Library, href: "/library" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-foreground/10 bg-background/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary navigation"
    >
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                relative flex h-full flex-1 flex-col items-center justify-center gap-1
                transition-colors duration-200
                ${active ? "text-foreground" : "text-foreground/45"}
              `}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <div className="absolute top-2 h-1 w-8 bg-foreground" />
              )}

              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none tracking-[0.02em]">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
