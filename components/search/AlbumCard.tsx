"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Album } from "@/lib/api/types";
import { motion } from "motion/react";
import { Play, Disc3 } from "lucide-react";

interface AlbumCardProps {
  album: Album;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  const coverUrl = album.cover
    ? `https://resources.tidal.com/images/${album.cover.replace(
        /-/g,
        "/"
      )}/750x750.jpg`
    : "/placeholder-album.png";

  const artistName =
    album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";
  const year = album.releaseDate
    ? new Date(album.releaseDate).getFullYear()
    : null;

  return (
    <Link href={`/album/${album.id}`} className="group relative block">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Background Layer - Blurred Album Art (Apple Music Style) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0">
            {/* Background blur - OPTIMIZED */}
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              quality={30}
              className="object-cover opacity-30 blur-2xl"
              priority={false}
              loading="lazy"
            />
            {/* Gradient overlay: darker at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
          </div>
        </div>

        {/* Card Content */}
        <div className="relative z-10 p-4">
          {/* Album Cover with Glassmorphism Container */}
          <div className="relative w-full aspect-square mb-4 rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.6)] transition-all duration-300">
            {/* Album Cover - OPTIMIZED */}
            <Image
              src={coverUrl}
              alt={album.title}
              fill
              sizes="(max-width: 768px) 160px, 200px"
              quality={85}
              className="object-cover"
              priority={false}
              loading="lazy"
            />

            {/* Hover Overlay with Play Button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileHover={{ scale: 1, opacity: 1 }}
                className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg"
              >
                <Play className="w-6 h-6 text-black fill-black ml-0.5" />
              </motion.div>
            </div>

            {/* Subtle inner glow */}
            <div className="absolute inset-0 border border-white/10 rounded-xl pointer-events-none" />
          </div>

          {/* Album Info - Apple Music Style */}
          <div className="space-y-2">
            {/* Album Title */}
            <h3 className="font-semibold text-base leading-tight line-clamp-2 text-white group-hover:text-white/90 transition-colors">
              {album.title}
            </h3>

            {/* Artist Name */}
            <p className="text-sm text-white/60 line-clamp-1 group-hover:text-white/70 transition-colors">
              {artistName}
            </p>

            {/* Album Meta Info - Minimal Pills */}
            <div className="flex items-center gap-2 pt-1">
              {year && (
                <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                  <span className="text-xs font-medium text-white/70">
                    {year}
                  </span>
                </div>
              )}
              {album.numberOfTracks && (
                <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                  <Disc3 className="w-3 h-3 text-white/60" />
                  <span className="text-xs font-medium text-white/70">
                    {album.numberOfTracks}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outer glow on hover */}
        <div className="absolute inset-0 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors duration-300 pointer-events-none" />
      </motion.div>
    </Link>
  );
}
