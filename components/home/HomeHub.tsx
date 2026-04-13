"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Disc, Heart, Music2 } from "lucide-react";
import { motion } from "motion/react";
import {
  useAudioPlayer,
  usePlaybackState,
  useQueue,
} from "@/contexts/AudioPlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import { api } from "@/lib/api";
import type { Album, Track } from "@/lib/api/types";
import {
  fetchRecommendationSections,
  flattenRecommendationTracks,
} from "@/lib/recommendations/client";
import {
  buildHomeRecommendationCacheKey,
  readHomeRecommendationCache,
  readLatestHomeRecommendationCache,
  writeHomeRecommendationCache,
} from "@/lib/recommendations/ui-cache";

function getTrackCoverUrl(track: Track, size = "160") {
  const coverId = track.album?.cover || track.album?.imageCover?.[0];
  if (!coverId) return null;
  return api.getCoverUrl(String(coverId), size);
}

function getAlbumCoverUrl(album: Album, size = "320") {
  const coverId = album.cover || album.imageCover?.[0];
  if (!coverId) return null;
  return api.getCoverUrl(String(coverId), size);
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count: number;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between border-b border-foreground/10 pb-2">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-foreground/90">
          {title}
        </h2>
        <span className="text-[10px] font-mono tabular-nums text-foreground/35">
          {count}
        </span>
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 transition-colors hover:text-foreground/70"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function CompactTrackRow({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  isLoading,
  onPlay,
  onToggleLike,
  isLiked,
}: {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onToggleLike: () => void;
  isLiked: boolean;
}) {
  const coverUrl = getTrackCoverUrl(track);
  const artistName =
    track.artist?.name || track.artists?.[0]?.name || "Unknown Artist";

  return (
    <div
      role="button"
      tabIndex={isLoading ? -1 : 0}
      aria-disabled={isLoading}
      onClick={() => {
        if (isLoading) return;
        onPlay();
      }}
      onKeyDown={(event) => {
        if (isLoading) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPlay();
        }
      }}
      className={`group grid w-full grid-cols-[40px_40px_1fr_auto_32px] items-center gap-4 border-b border-foreground/10 px-6 py-3 text-left transition-colors hover:bg-foreground/[0.02] last:border-b-0 lg:grid-cols-[40px_40px_1fr_180px_100px_auto_32px] ${
        isCurrentTrack ? "border-l-[3px] border-l-foreground" : "border-l-[3px] border-l-transparent"
      } ${isLoading ? "cursor-default opacity-60" : "cursor-pointer"}`}
    >
      <span className="text-center text-xs font-mono tabular-nums text-foreground/30">
        {isCurrentTrack && isPlaying ? (
          <span className="flex items-end justify-center gap-[2px] h-4">
            <span className="w-1 animate-[wave1_0.6s_ease-in-out_infinite] rounded-full bg-foreground" />
            <span
              className="w-1 animate-[wave2_0.6s_ease-in-out_infinite] rounded-full bg-foreground"
              style={{ animationDelay: "0.1s" }}
            />
            <span
              className="w-1 animate-[wave3_0.6s_ease-in-out_infinite] rounded-full bg-foreground"
              style={{ animationDelay: "0.2s" }}
            />
          </span>
        ) : (
          String(index + 1).padStart(2, "0")
        )}
      </span>

      <div className="h-10 w-10 shrink-0 overflow-hidden border border-foreground/10 bg-foreground/5">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={track.title}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music2 className="h-4 w-4 text-foreground/20" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <h3
          className={`truncate text-[14px] font-medium tracking-[-0.01em] ${
            isCurrentTrack ? "text-foreground" : "text-foreground/90"
          }`}
        >
          {track.title}
        </h3>
        <p className="truncate text-[12px] text-foreground/50">{artistName}</p>
      </div>

      <p className="hidden truncate text-[13px] text-foreground/30 italic lg:block">
        {track.album?.title || ""}
      </p>

      {track.audioQuality && (
        <span className="hidden text-[9px] font-mono font-bold uppercase tracking-wider text-foreground/40 lg:inline">
          {track.audioQuality === "HI_RES" ? "HI-RES" : track.audioQuality}
        </span>
      )}

      <span className="hidden text-[12px] font-mono tabular-nums text-foreground/30 lg:inline">
        {track.duration ? formatDuration(track.duration) : ""}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isLoading) return;
          onToggleLike();
        }}
        className="flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
        disabled={isLoading}
        aria-label={isLiked ? "Unlike track" : "Like track"}
      >
        <Heart
          className={`h-3.5 w-3.5 ${
            isLiked
              ? "fill-foreground text-foreground"
              : "text-foreground/30 hover:text-foreground/60"
          }`}
        />
      </button>
    </div>
  );
}

function AlbumGrid({ albums }: { albums: Album[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {albums.map((album) => {
        const coverUrl = getAlbumCoverUrl(album);
        const artistName =
          album.artist?.name || album.artists?.[0]?.name || "Unknown Artist";

        return (
          <Link
            key={album.id}
            href={`/album/${album.id}`}
            className="group border border-foreground/10 bg-background transition-colors hover:border-foreground/20"
          >
            <div className="relative aspect-square overflow-hidden border-b border-foreground/10 bg-foreground/5">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={album.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Disc className="h-6 w-6 text-foreground/20" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="truncate text-[13px] font-medium text-foreground/90 group-hover:text-foreground">
                {album.title}
              </h3>
              <p className="truncate text-[11px] text-foreground/45">
                {artistName}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyHub() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <div className="max-w-md border border-foreground/10 px-12 py-16 text-center">
        <div className="mb-6">
          <Music2 className="mx-auto h-10 w-10 text-foreground/20" />
        </div>
        <h3 className="mb-2 text-sm font-mono uppercase tracking-widest text-foreground/90">
          YOUR LIBRARY STARTS HERE
        </h3>
        <p className="text-[11px] font-mono uppercase tracking-wider text-foreground/50">
          Search for a song, album, or artist to start listening
        </p>
      </div>
    </div>
  );
}

export function HomeHub() {
  const { isPlaying } = usePlaybackState();
  const { currentTrack } = useQueue();
  const { setQueue } = useAudioPlayer();
  const {
    recentlyPlayed,
    likedTracks,
    savedAlbums,
    isTrackLiked,
    toggleTrackLike,
    addRecentlyPlayed,
  } = useLibrary();

  const [loadingTrackId, setLoadingTrackId] = useState<number | null>(null);
  const [recommendedTracks, setRecommendedTracks] = useState<Track[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsUpdating, setRecommendationsUpdating] = useState(false);

  const recentSlice = useMemo(() => recentlyPlayed.slice(0, 10), [recentlyPlayed]);
  const recentSeeds = useMemo(() => recentlyPlayed.slice(0, 5), [recentlyPlayed]);
  const favoritesSlice = useMemo(() => likedTracks.slice(0, 8), [likedTracks]);
  const albumsSlice = useMemo(() => savedAlbums.slice(0, 10), [savedAlbums]);

  const hasContent =
    recentlyPlayed.length > 0 ||
    likedTracks.length > 0 ||
    savedAlbums.length > 0;

  const handlePlayTrack = useCallback(
    async (collection: Track[], index: number) => {
      const track = collection[index];
      if (!track || loadingTrackId === track.id) return;

      setLoadingTrackId(track.id);
      try {
        await setQueue(collection, index);
        addRecentlyPlayed(track);
      } finally {
        setLoadingTrackId(null);
      }
    },
    [setQueue, addRecentlyPlayed, loadingTrackId],
  );

  useEffect(() => {
    if (recentSeeds.length === 0) {
      setRecommendedTracks([]);
      setRecommendationsLoading(false);
      setRecommendationsUpdating(false);
      return;
    }

    const initialController = new AbortController();
    const backgroundController = new AbortController();
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;
      setRecommendationsLoading(true);
    });

    const seeds = recentSeeds.map((track) => ({
      title: track.title,
      artist: track.artist?.name || track.artists?.[0]?.name || "",
      album: track.album?.title,
      duration: track.duration,
    }));
    const initialSeeds = seeds.slice(0, 2);
    const provider = String(recentSeeds[0]?.id).startsWith("q:") ? "qobuz" : "tidal";
    const cacheKey = buildHomeRecommendationCacheKey(provider, seeds);
    const cachedSections =
      readHomeRecommendationCache(cacheKey) ?? readLatestHomeRecommendationCache();

    if (cachedSections) {
      setRecommendedTracks(flattenRecommendationTracks(cachedSections));
      setRecommendationsUpdating(true);
    }

    void fetchRecommendationSections(
      {
        title: initialSeeds[0]?.title || "Unknown Title",
        artist: initialSeeds[0]?.artist || "Unknown Artist",
        seeds: initialSeeds,
        provider,
        perSectionLimit: 10,
      },
      initialController.signal,
    )
      .then((sections) => {
        if (!isActive) return;
        setRecommendedTracks(flattenRecommendationTracks(sections));
        writeHomeRecommendationCache(cacheKey, sections);
        setRecommendationsUpdating(false);

        void fetchRecommendationSections(
          {
            title: seeds[0]?.title || "Unknown Title",
            artist: seeds[0]?.artist || "Unknown Artist",
            seeds,
            provider,
            perSectionLimit: 20,
          },
          backgroundController.signal,
        )
          .then((backgroundSections) => {
            if (!isActive) return;
            setRecommendedTracks(flattenRecommendationTracks(backgroundSections));
            writeHomeRecommendationCache(cacheKey, backgroundSections);
            setRecommendationsUpdating(false);
          })
          .catch((error: unknown) => {
            if (!isActive) return;
            if (error instanceof Error && error.name === "AbortError") return;
            console.error("Failed to load extended home recommendations:", error);
          });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Failed to load home recommendations:", error);
        if (!cachedSections) {
          setRecommendedTracks([]);
        }
        setRecommendationsUpdating(false);
      })
      .finally(() => {
        if (!isActive) return;
        setRecommendationsLoading(false);
      });

    return () => {
      isActive = false;
      initialController.abort();
      backgroundController.abort();
    };
  }, [recentSeeds]);

  if (!hasContent) {
    return <EmptyHub />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col gap-10"
    >
      {recentSlice.length > 0 && (
        <section>
          <SectionHeader
            title="Recently Played"
            count={recentSlice.length}
            action={{ label: "VIEW ALL", href: "/library" }}
          />
          <div className="mt-3 border border-foreground/10">
            {recentSlice.map((track, index) => (
              <CompactTrackRow
                key={`recent-${track.id}-${index}`}
                track={track}
                index={index}
                isCurrentTrack={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                isLoading={loadingTrackId === track.id}
                onPlay={() => handlePlayTrack(recentSlice, index)}
                onToggleLike={() => toggleTrackLike(track)}
                isLiked={isTrackLiked(track.id)}
              />
            ))}
          </div>
        </section>
      )}

      {(recommendedTracks.length > 0 || recommendationsLoading) && (
        <section>
          <SectionHeader
            title="For You"
            count={recommendedTracks.length}
          />
          <div className="mt-3 border border-foreground/10">
            {recommendationsLoading && recommendedTracks.length === 0 ? (
              <div className="px-6 py-8 text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/40">
                Building picks from your last 5 plays...
              </div>
            ) : (
              <>
                {recommendationsUpdating ? (
                  <div className="border-b border-foreground/10 px-6 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-foreground/35">
                    Refreshing picks from your latest plays...
                  </div>
                ) : null}
                {recommendedTracks.slice(0, 10).map((track, index) => (
                  <CompactTrackRow
                    key={`rec-${track.id}-${index}`}
                    track={track}
                    index={index}
                    isCurrentTrack={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    isLoading={loadingTrackId === track.id}
                    onPlay={() => handlePlayTrack(recommendedTracks.slice(0, 10), index)}
                    onToggleLike={() => toggleTrackLike(track)}
                    isLiked={isTrackLiked(track.id)}
                  />
                ))}
              </>
            )}
          </div>
        </section>
      )}

      {favoritesSlice.length > 0 && (
        <section>
          <SectionHeader
            title="Favorites"
            count={likedTracks.length}
            action={{ label: "VIEW ALL", href: "/library" }}
          />
          <div className="mt-3 border border-foreground/10">
            {favoritesSlice.map((track, index) => (
              <CompactTrackRow
                key={`fav-${track.id}-${index}`}
                track={track}
                index={index}
                isCurrentTrack={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                isLoading={loadingTrackId === track.id}
                onPlay={() => handlePlayTrack(favoritesSlice, index)}
                onToggleLike={() => toggleTrackLike(track)}
                isLiked={isTrackLiked(track.id)}
              />
            ))}
          </div>
        </section>
      )}

      {albumsSlice.length > 0 && (
        <section>
          <SectionHeader
            title="Saved Albums"
            count={savedAlbums.length}
            action={{ label: "VIEW ALL", href: "/library" }}
          />
          <div className="mt-3">
            <AlbumGrid albums={albumsSlice} />
          </div>
        </section>
      )}
    </motion.div>
  );
}
