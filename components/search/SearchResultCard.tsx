"use client";

import { Track } from "@/lib/api/types";
import { getTrackTitle, formatTime } from "@/lib/api/utils";
import { Music, Play, Disc, Clock, TrendingUp, Volume2 } from "lucide-react";
import { api } from "@/lib/api";
import Image from "next/image";

interface SearchResultCardProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function SearchResultCard({
  track,
  isCurrentTrack,
  isPlaying,
  isLoading,
  onClick,
}: SearchResultCardProps) {
  // Check if album has a cover UUID, otherwise use album ID
  const coverId = track.album?.cover || track.album?.id;
  const coverUrl = coverId ? api.getCoverUrl(coverId, "320") : undefined;

  // Get audio quality tags
  const qualityTags = track.mediaMetadata?.tags || [];
  const hasHiRes = qualityTags.includes("HIRES_LOSSLESS");
  const hasLossless = qualityTags.includes("LOSSLESS");
  const hasDolbyAtmos = qualityTags.includes("DOLBY_ATMOS");

  // Get all artists (including featured)
  const allArtists = track.artists || (track.artist ? [track.artist] : []);
  const mainArtists = allArtists.filter((a) => a.type === "MAIN");
  const featuredArtists = allArtists.filter((a) => a.type === "FEATURED");

  return (
    <div
      onClick={onClick}
      className={`group relative p-4 bg-white border border-carbon
                 hover:bg-bone hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                 active:translate-x-[1px] active:translate-y-[1px]
                 transition-all duration-150 cursor-pointer
                 ${
                   isCurrentTrack && isPlaying
                     ? "border-walkman-orange border-2"
                     : ""
                 }
                 ${isLoading ? "opacity-50" : ""}`}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-carbon border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Album Art */}
        <div
          className="relative flex-shrink-0 w-16 h-16 bg-bone border border-carbon overflow-hidden
                       shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]"
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={track.album?.title || "Album cover"}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-6 h-6 text-carbon" />
            </div>
          )}

          {/* Play indicator overlay */}
          <div
            className="absolute inset-0 bg-carbon/0 group-hover:bg-carbon/70
                          transition-all duration-200 flex items-center justify-center"
          >
            <Play
              className="w-6 h-6 text-white opacity-0 group-hover:opacity-100
                           transition-opacity duration-200 fill-white"
            />
          </div>

          {/* Track Number Badge */}
          {track.trackNumber && (
            <div className="absolute bottom-0 left-0 bg-carbon text-white text-[9px] font-mono px-1 py-0.5">
              {track.trackNumber}
            </div>
          )}
        </div>

        {/* Main Track Info */}
        <div className="flex-1 min-w-0">
          {/* Title and Explicit Badge */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-carbon font-medium text-base truncate font-mono">
              {getTrackTitle(track)}
            </h3>
            {track.explicit && (
              <span className="flex-shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 bg-carbon text-white border border-carbon">
                E
              </span>
            )}
          </div>

          {/* Artists */}
          <div className="text-gray-600 text-sm font-mono mb-1">
            {mainArtists.map((artist, i) => (
              <span key={artist.id}>
                {i > 0 && ", "}
                {artist.name}
              </span>
            ))}
            {featuredArtists.length > 0 && (
              <span className="text-gray-400">
                {" "}
                ft. {featuredArtists.map((a) => a.name).join(", ")}
              </span>
            )}
          </div>

          {/* Album */}
          {track.album?.title && (
            <div className="flex items-center gap-1 text-gray-400 text-xs font-mono mb-2">
              <Disc className="w-3 h-3" />
              <span className="truncate">{track.album.title}</span>
            </div>
          )}

          {/* Metadata Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Audio Quality Badges */}
            {hasDolbyAtmos && (
              <span className="text-[9px] font-mono font-bold px-2 py-1 bg-walkman-orange text-white border border-carbon shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                DOLBY ATMOS
              </span>
            )}
            {hasHiRes && (
              <span className="text-[9px] font-mono font-bold px-2 py-1 bg-walkman-yellow text-carbon border border-carbon shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                HI-RES
              </span>
            )}
            {hasLossless && !hasHiRes && (
              <span className="text-[9px] font-mono font-bold px-2 py-1 bg-bone text-carbon border border-carbon shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                LOSSLESS
              </span>
            )}

            {/* Popularity */}
            {track.popularity !== undefined && (
              <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 bg-white border border-carbon">
                <TrendingUp className="w-3 h-3" />
                {track.popularity}
              </span>
            )}

            {/* BPM */}
            {track.bpm && (
              <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 bg-white border border-carbon">
                <Clock className="w-3 h-3" />
                {track.bpm} BPM
              </span>
            )}

            {/* Key */}
            {track.key && track.keyScale && (
              <span className="text-[9px] font-mono px-2 py-1 bg-white border border-carbon">
                {track.key} {track.keyScale}
              </span>
            )}

            {/* Audio Modes */}
            {track.audioModes && track.audioModes.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-1 bg-white border border-carbon">
                <Volume2 className="w-3 h-3" />
                {track.audioModes[0]}
              </span>
            )}
          </div>
        </div>

        {/* Duration and Now Playing */}
        <div className="flex-shrink-0 text-right">
          <div className="text-[9px] font-mono tracking-widest mb-1 uppercase text-gray-500">
            DURATION
          </div>
          <div className="text-carbon text-sm font-mono tabular-nums font-bold">
            {formatTime(track.duration)}
          </div>

          {/* Now Playing Indicator */}
          {isCurrentTrack && isPlaying && (
            <div className="flex items-center gap-0.5 mt-2 justify-end">
              <div className="w-0.5 h-3 bg-walkman-orange animate-pulse"></div>
              <div
                className="w-0.5 h-2 bg-walkman-orange animate-pulse"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-0.5 h-4 bg-walkman-orange animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info on Hover */}
      <div className="mt-3 pt-3 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] font-mono text-gray-500">
          {track.streamStartDate && (
            <div>
              <span className="uppercase tracking-wider">Released:</span>{" "}
              {new Date(track.streamStartDate).toLocaleDateString()}
            </div>
          )}
          {track.isrc && (
            <div>
              <span className="uppercase tracking-wider">ISRC:</span>{" "}
              {track.isrc}
            </div>
          )}
          {track.replayGain !== undefined && (
            <div>
              <span className="uppercase tracking-wider">Gain:</span>{" "}
              {track.replayGain.toFixed(2)} dB
            </div>
          )}
          {track.copyright && (
            <div className="col-span-2 md:col-span-4 truncate">
              <span className="uppercase tracking-wider">©</span>{" "}
              {track.copyright}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
