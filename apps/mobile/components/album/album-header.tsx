import React from "react";
import { View, Text, Pressable } from "@/src/tw";
import { CoverImage } from "@/components/common/cover-image";
import { formatDuration } from "@side-a/shared";
import type { Album, Track } from "@side-a/shared/api/types";

interface AlbumHeaderProps {
  album: Album;
  tracks: Track[];
  onPlayAlbum: () => void;
  isAlbumPlaying: boolean;
}

export function AlbumHeader({ album, tracks, onPlayAlbum, isAlbumPlaying }: AlbumHeaderProps) {
  const artistName = album.artist?.name ?? album.artists?.[0]?.name ?? "Unknown Artist";
  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;
  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);

  return (
    <View className="items-center px-6 pt-4 pb-6 gap-4">
      <CoverImage
        coverId={album.cover ?? album.id}
        size="1280"
        width={280}
        height={280}
        borderRadius={8}
      />
      <View className="items-center gap-1">
        <Text className="text-xl font-semibold text-sf-text text-center" numberOfLines={2}>
          {album.title}
        </Text>
        <Text className="text-[15px] text-sf-blue">{artistName}</Text>
        <Text className="text-[13px] text-sf-text-2">
          {[year, `${tracks.length} tracks`, formatDuration(totalDuration)]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
      <Pressable
        onPress={onPlayAlbum}
        className="bg-sf-blue rounded-full px-8 py-3 mt-2"
      >
        <Text className="text-white font-semibold text-[15px]">
          {isAlbumPlaying ? "Pause" : "Play"}
        </Text>
      </Pressable>
    </View>
  );
}
