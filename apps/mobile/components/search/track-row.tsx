import React from "react";
import { Image } from "expo-image";
import { View, Text, Pressable } from "@/src/tw";
import { api } from "@/lib/api";
import { formatTime, getTrackTitle, getTrackArtists, hasExplicitContent } from "@side-a/shared";
import type { Track } from "@side-a/shared/api/types";

interface TrackRowProps {
  track: Track;
  onPress: (track: Track) => void;
  isPlaying?: boolean;
}

export const TrackRow = React.memo(function TrackRow({ track, onPress, isPlaying }: TrackRowProps) {
  const coverUrl = api.getCoverUrl(track.album?.cover ?? track.album?.id ?? "", "160");

  return (
    <Pressable
      className={`flex-row items-center px-4 py-3 gap-3 ${isPlaying ? "bg-sf-text/5" : ""}`}
      onPress={() => onPress(track)}
    >
      <Image
        source={{ uri: coverUrl }}
        style={{ width: 48, height: 48, borderRadius: 6 }}
        contentFit="cover"
        transition={200}
      />
      <View className="flex-1 min-w-0">
        <Text
          className={`text-[15px] font-medium ${isPlaying ? "text-sf-blue" : "text-sf-text"}`}
          numberOfLines={1}
        >
          {getTrackTitle(track)}
        </Text>
        <View className="flex-row items-center gap-1">
          {hasExplicitContent(track) && (
            <View className="bg-sf-text/20 rounded px-1">
              <Text className="text-[9px] font-bold text-sf-text/60">E</Text>
            </View>
          )}
          <Text className="text-[13px] text-sf-text-2" numberOfLines={1}>
            {getTrackArtists(track)}
          </Text>
        </View>
      </View>
      <Text className="text-[12px] text-sf-text-2 tabular-nums">
        {formatTime(track.duration)}
      </Text>
    </Pressable>
  );
});
