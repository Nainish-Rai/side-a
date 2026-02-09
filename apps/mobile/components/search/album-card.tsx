import React from "react";
import { Image } from "expo-image";
import { View, Text, Pressable } from "@/src/tw";
import { api } from "@/lib/api";
import type { Album } from "@side-a/shared/api/types";

interface AlbumCardProps {
  album: Album;
  onPress: (album: Album) => void;
}

export const AlbumCard = React.memo(function AlbumCard({ album, onPress }: AlbumCardProps) {
  const coverUrl = api.getCoverUrl(album.cover ?? album.id, "320");
  const artistName = album.artist?.name ?? album.artists?.[0]?.name ?? "Unknown Artist";
  const year = album.releaseDate ? new Date(album.releaseDate).getFullYear() : null;

  return (
    <Pressable className="flex-row items-center px-4 py-3 gap-3" onPress={() => onPress(album)}>
      <Image
        source={{ uri: coverUrl }}
        style={{ width: 56, height: 56, borderRadius: 6 }}
        contentFit="cover"
        transition={200}
      />
      <View className="flex-1 min-w-0">
        <Text className="text-[15px] font-medium text-sf-text" numberOfLines={1}>
          {album.title}
        </Text>
        <Text className="text-[13px] text-sf-text-2" numberOfLines={1}>
          {[artistName, year].filter(Boolean).join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
});
