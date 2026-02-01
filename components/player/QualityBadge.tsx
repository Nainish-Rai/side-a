"use client";

import { motion } from "motion/react";
import React from "react";

interface QualityBadgeProps {
  quality: string;
  onClick?: () => void;
}

export const QualityBadge = React.memo(({ quality, onClick }: QualityBadgeProps) => {
  // Determine if quality is premium (LOSSLESS or HI_RES variants)
  const isPremium = ["LOSSLESS", "HI_RES_LOSSLESS", "HI_RES"].includes(quality);

  // Get bitrate based on quality
  let bitrate = "";
  if (quality === "HI_RES_LOSSLESS" || quality === "HI_RES" || quality === "LOSSLESS") {
    bitrate = "1411";
  } else if (quality === "HIGH") {
    bitrate = "320";
  } else if (quality === "LOW") {
    bitrate = "96";
  }

  // Format display text
  const qualityText =
    quality === "HI_RES_LOSSLESS" || quality === "HI_RES"
      ? "HI-RES"
      : quality;

  // Color scheme: gray for standard, accent for premium
  const colorClasses = isPremium
    ? "bg-white/20 text-white"
    : "bg-gray-500/20 text-gray-400";

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`px-2 py-1 rounded-md text-[10px] font-semibold tracking-wide transition-all cursor-pointer hover:brightness-110 ${colorClasses}`}
      aria-label={`Audio quality: ${quality} at ${bitrate}kbps. Click to view details.`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className="flex items-center gap-1">
        <span>{qualityText}</span>
        {bitrate && (
          <>
            <span className="opacity-50">·</span>
            <span>{bitrate}kbps</span>
          </>
        )}
      </span>
    </motion.button>
  );
});

QualityBadge.displayName = "QualityBadge";
