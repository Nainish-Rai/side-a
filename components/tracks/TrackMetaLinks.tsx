"use client";

import type { MouseEvent, PointerEvent, TouchEvent } from "react";
import Link from "next/link";
import type { UrlObject } from "url";
import type { Artist, Track } from "@/lib/api/types";

interface TrackArtistLinksProps {
  track: Track;
  fallbackArtist?: string;
  className?: string;
}

interface TrackAlbumLinkProps {
  track: Track;
  fallbackAlbum?: string;
  className?: string;
}

function stopPropagation(
  event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement> | TouchEvent<HTMLElement>,
) {
  event.stopPropagation();
}

function getArtistList(track: Track, fallbackArtist?: string): Artist[] {
  if (track.artists?.length) {
    const mainArtists = track.artists.filter((artist) => artist.type === "MAIN");
    return mainArtists.length > 0 ? mainArtists : track.artists;
  }

  if (track.artist?.name) {
    return [track.artist];
  }

  if (fallbackArtist) {
    return [{ id: 0, name: fallbackArtist }];
  }

  return [];
}

function renderMaybeLinkedText({
  href,
  label,
  className,
}: {
  href?: string | UrlObject;
  label: string;
  className?: string;
}) {
  if (!href) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onTouchStart={stopPropagation}
    >
      {label}
    </Link>
  );
}

export function TrackArtistLinks({
  track,
  fallbackArtist,
  className,
}: TrackArtistLinksProps) {
  const artists = getArtistList(track, fallbackArtist);

  if (artists.length === 0) {
    return <span className={className}>Unknown Artist</span>;
  }

  return (
    <>
      {artists.map((artist, index) => (
        <span key={`${artist.id}-${artist.name}`}>
          {index > 0 ? ", " : null}
          {renderMaybeLinkedText({
            href: artist.id
              ? {
                  pathname: `/artist/${artist.id}`,
                  query: { name: artist.name },
                }
              : undefined,
            label: artist.name,
            className,
          })}
        </span>
      ))}
    </>
  );
}

export function TrackAlbumLink({
  track,
  fallbackAlbum,
  className,
}: TrackAlbumLinkProps) {
  const albumTitle = track.album?.title || fallbackAlbum;

  if (!albumTitle) {
    return null;
  }

  return renderMaybeLinkedText({
    href: track.album?.id ? `/album/${track.album.id}` : undefined,
    label: albumTitle,
    className,
  });
}
