import React from "react";
import { Image } from "expo-image";
import { View, Text, Pressable } from "@/src/tw";
import { api } from "@/lib/api";
import type { Artist } from "@side-a/shared/api/types";

interface ArtistCardProps {
  artist: Artist;
  onPress: (artist: Artist) => void;
}

export const ArtistCard = React.memo(function ArtistCard({ artist, onPress }: ArtistCardProps) {
  const pictureUrl = artist.picture
    ? api.getCoverUrl(artist.picture, "320")
    : null;

  return (
    <Pressable className="flex-row items-center px-4 py-3 gap-3" onPress={() => onPress(artist)}>
      {pictureUrl ? (
        <Image
          source={{ uri: pictureUrl }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-sf-bg-2 items-center justify-center">
          <Text className="text-sf-text-2 text-lg font-medium">{artist.name.charAt(0)}</Text>
        </View>
      )}
      <View className="flex-1 min-w-0">
        <Text className="text-[15px] font-medium text-sf-text" numberOfLines={1}>
          {artist.name}
        </Text>
        <Text className="text-[13px] text-sf-text-2">Artist</Text>
      </View>
    </Pressable>
  );
});
