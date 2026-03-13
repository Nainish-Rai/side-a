"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const walkmanToasts = {
  loading: {
    icon: "◉ PLAYING",
    description: "TUNING FREQUENCY...",
  },
  success: {
    icon: "✓ RECORDED",
    description: "STATION SAVED TO TAPE",
  },
  error: {
    icon: "✕ EJECTED",
    description: "CASSETTE JAMMED",
  },
};

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#ffffff",
          fontFamily: "monospace",
        },
        classNames: {
          toast: "group toast bg-transparent border border-white/10 shadow-none",
          title:
            "text-xs font-mono uppercase tracking-widest text-white/90",
          description:
            "text-[10px] font-mono uppercase tracking-wider text-white/40",
          icon: "text-[10px] font-mono uppercase tracking-widest text-white/60",
          actionButton:
            "bg-white text-black border border-white text-[9px] font-mono uppercase tracking-widest hover:bg-white/90",
          cancelButton:
            "bg-transparent text-white/40 border border-white/20 text-[9px] font-mono uppercase tracking-widest hover:text-white/70 hover:border-white/40",
          error: "border-l-2 border-l-white",
          success: "border-l-2 border-l-white",
          closeButton:
            "bg-transparent text-white/40 border border-white/10 hover:text-white hover:border-white/30",
        },
      }}
      {...props}
    />
  );
}
