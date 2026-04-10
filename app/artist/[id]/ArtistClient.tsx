"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Album, Artist, Track } from "@/lib/api/types";
import {
  useAudioPlayer,
  usePlaybackState,
  useQueue,
} from "@/contexts/AudioPlayerContext";
import { ArrowLeft, Pause, Play, User2, FolderPlus } from "lucide-react";
import { getTrackTitle, formatTime } from "@/lib/api/utils";
import { AudioPlayer } from "@/components/player/AudioPlayer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrackPlaylistPickerDialog } from "@/components/playlists/PlaylistDialogs";
import { useLibrary } from "@/contexts/LibraryContext";
import { TrackAlbumLink, TrackArtistLinks } from "@/components/tracks/TrackMetaLinks";

interface ArtistClientProps {
  artist: Artist;
  topTracks: Track[];
  discography: Album[];
}

const normalizeText = (value?: string | null): string =>
  (value || "").trim().toLowerCase();

export function ArtistClient({ artist, topTracks, discography }: ArtistClientProps) {
  const router = useRouter();

  const { isPlaying } = usePlaybackState();
  const { currentTrack } = useQueue();
  const { setQueue, togglePlayPause } = useAudioPlayer();
  const { getPlaylistsForTrack } = useLibrary();
  const [playlistPickerTrack, setPlaylistPickerTrack] = useState<Track | null>(null);

  const topTrackIds = useMemo(() => new Set(topTracks.map((track) => track.id)), [topTracks]);

  const isArtistPlaying = !!currentTrack && topTrackIds.has(currentTrack.id);

  const pictureUrl = artist.picture
    ? `https://resources.tidal.com/images/${artist.picture.replace(/-/g, "/")}/750x750.jpg`
    : null;

  const handlePlayArtist = () => {
    if (topTracks.length === 0) {
      return;
    }

    if (isArtistPlaying) {
      togglePlayPause();
      return;
    }

    setQueue(topTracks, 0);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
      return;
    }

    setQueue(topTracks, index);
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-background border-b border-foreground/10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-widest">Back</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        <section className="flex flex-col md:flex-row gap-8 md:gap-12 pb-8 border-b border-foreground/10">
          <div className="relative shrink-0 w-[280px] md:w-[320px] aspect-square border border-foreground/10 overflow-hidden bg-foreground/5">
            {pictureUrl ? (
              <Image
                src={pictureUrl}
                alt={artist.name || "Artist"}
                width={320}
                height={320}
                sizes="(max-width: 768px) 280px, 320px"
                className="object-cover"
                priority={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground/20">
                <User2 className="w-20 h-20" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-3">
                Artist
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-foreground tracking-tight leading-tight mb-4">
                {artist.name || "Unknown Artist"}
              </h1>

              <div className="flex items-center gap-6 pt-4 border-t border-foreground/10">
                <div>
                  <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-1">
                    Top Tracks
                  </div>
                  <div className="text-sm font-mono tabular-nums text-foreground/70">
                    {topTracks.length}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-1">
                    Releases
                  </div>
                  <div className="text-sm font-mono tabular-nums text-foreground/70">
                    {discography.length}
                  </div>
                </div>
                {artist.type && (
                  <div>
                    <div className="text-[9px] tracking-widest uppercase text-foreground/40 font-mono mb-1">
                      Type
                    </div>
                    <div className="text-sm font-mono tabular-nums text-foreground/70 uppercase">
                      {artist.type}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={handlePlayArtist}
                disabled={topTracks.length === 0}
                className="px-6 py-3 border-2 border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-all flex items-center gap-2 font-mono uppercase text-xs tracking-widest disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
              >
                {isArtistPlaying && isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play Top Tracks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Top Tracks
          </div>

          {topTracks.length === 0 ? (
            <div className="border border-foreground/10 px-6 py-8 text-sm text-foreground/50">
              No tracks found for this artist.
            </div>
          ) : (
            <div className="border-t border-foreground/10">
              <div className="sticky top-[73px] z-20 bg-background/95 backdrop-blur-xl border-b border-foreground/10">
                <div className="grid grid-cols-[50px_1fr_120px_100px] md:grid-cols-[50px_1fr_180px_120px_100px] gap-4 px-6 py-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    #
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Title
                  </span>
                  <span className="hidden md:block text-[10px] font-mono uppercase tracking-widest text-foreground/40 text-right">
                    Album
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 text-right">
                    Plays
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 text-right">
                    Time / Save
                  </span>
                </div>
              </div>

              <div>
                {topTracks.map((track, index) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const albumTitle = track.album?.title || "Single";
                  const playlists = getPlaylistsForTrack(track.id);
                  const playlistLabel =
                    playlists.length > 0
                      ? playlists.map((playlist) => playlist.name).join(", ")
                      : "";

                  return (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrack(track, index)}
                      className={`grid grid-cols-[50px_1fr_120px_100px] md:grid-cols-[50px_1fr_180px_120px_100px] gap-4 items-center px-6 py-3 border-b border-foreground/10 cursor-pointer transition-all duration-200 hover:bg-foreground/[0.02] ${
                        isCurrent
                          ? "border-l-[3px] border-l-foreground pl-[21px]"
                          : "border-l-[3px] border-l-transparent"
                      }`}
                    >
                      <div className="text-center">
                        <span
                          className={`text-sm font-mono ${
                            isCurrent ? "text-foreground" : "text-foreground/40"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3
                          className={`font-medium text-[15px] truncate transition-colors ${
                            isCurrent
                              ? "text-foreground"
                              : "text-foreground/90 hover:text-foreground"
                          }`}
                        >
                          {getTrackTitle(track)}
                        </h3>
                        <p
                          className={`text-[13px] truncate transition-colors ${
                            isCurrent
                              ? "text-foreground/70"
                              : "text-foreground/50 hover:text-foreground/70"
                          }`}
                        >
                          <TrackArtistLinks
                            track={track}
                            fallbackArtist={artist.name || "Unknown Artist"}
                            className="hover:text-foreground/80 transition-colors"
                          />
                        </p>
                        {playlists.length > 0 && (
                          <p
                            className="mt-1 text-[10px] font-mono uppercase tracking-wider text-foreground/35"
                            title={playlistLabel}
                          >
                            PL {playlists.length}
                          </p>
                        )}
                      </div>

                      <div className="hidden md:block min-w-0 text-right">
                        <span className="text-[13px] text-foreground/30 italic truncate block">
                          <TrackAlbumLink
                            track={track}
                            fallbackAlbum={albumTitle}
                            className="hover:text-foreground/55 transition-colors"
                          />
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[12px] font-mono text-foreground/40 tabular-nums">
                          {track.popularity || "-"}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPlaylistPickerTrack(track);
                          }}
                          className="text-foreground/35 transition-colors hover:text-foreground/80"
                          aria-label="Add to playlist"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[12px] font-mono text-foreground/40 tabular-nums">
                          {formatTime(track.duration || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Discography
          </div>

          {discography.length === 0 ? (
            <div className="border border-foreground/10 px-6 py-8 text-sm text-foreground/50">
              No albums found for this artist.
            </div>
          ) : (
            <div className="border-t border-foreground/10">
              <div className="sticky top-[73px] z-10 bg-background/95 backdrop-blur-xl border-b border-foreground/10">
                <div className="grid grid-cols-[1fr_80px_80px] gap-4 px-6 py-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                    Release
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 text-right">
                    Year
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 text-right">
                    Tracks
                  </span>
                </div>
              </div>

              <div>
                {discography.map((album) => {
                  const albumArtistName =
                    album.artist?.name || album.artists?.[0]?.name || artist.name;
                  const matchesMainArtist =
                    normalizeText(albumArtistName) === normalizeText(artist.name);
                  const year = album.releaseDate
                    ? new Date(album.releaseDate).getFullYear()
                    : "-";

                  return (
                    <button
                      key={album.id}
                      onClick={() => router.push(`/album/${album.id}`)}
                      className="w-full text-left grid grid-cols-[1fr_80px_80px] gap-4 items-center px-6 py-3 border-b border-foreground/10 transition-all duration-200 hover:bg-foreground/[0.02]"
                    >
                      <div className="min-w-0">
                        <div className="text-[15px] text-foreground/90 truncate">
                          {album.title || "Untitled Album"}
                        </div>
                        <div className="text-[11px] font-mono uppercase tracking-wider text-foreground/40 truncate">
                          {matchesMainArtist ? "Album" : albumArtistName}
                        </div>
                      </div>

                      <div className="text-right text-[12px] font-mono text-foreground/40 tabular-nums">
                        {year}
                      </div>

                      <div className="text-right text-[12px] font-mono text-foreground/40 tabular-nums">
                        {album.numberOfTracks || "-"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <AudioPlayer />
      <TrackPlaylistPickerDialog
        isOpen={playlistPickerTrack !== null}
        track={playlistPickerTrack}
        onClose={() => setPlaylistPickerTrack(null)}
      />
    </div>
  );
}
