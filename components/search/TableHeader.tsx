"use client";

import React from "react";

export function TableHeader() {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-foreground/10">
      <div className="grid grid-cols-[50px_40px_1fr_180px_120px_80px] lg:grid-cols-[50px_40px_1fr_180px_120px_80px] md:grid-cols-[40px_40px_1fr_60px] gap-4 px-6 py-3">
        {/* Track Number */}
        <div className="text-center">
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/55">
            #
          </span>
        </div>

        {/* Cover Art - Empty header */}
        <div></div>

        {/* Title */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/55">
            TITLE
          </span>
        </div>

        {/* Album (Desktop only) */}
        <div className="hidden lg:block">
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/55">
            ALBUM
          </span>
        </div>

        {/* Quality (Desktop only) */}
        <div className="hidden lg:block">
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/55">
            QUALITY
          </span>
        </div>

        {/* Duration */}
        <div className="text-right">
          <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/55">
            TIME
          </span>
        </div>
      </div>
    </div>
  );
}
