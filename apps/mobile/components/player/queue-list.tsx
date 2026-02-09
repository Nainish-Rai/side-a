import React from "react";
import { FlashList } from "@shopify/flash-list";
import { View, Text, Pressable } from "@/src/tw";
import { Image } from "expo-image";
import { useAudio } from "@/contexts/audio-context";
import { api } from "@/lib/api";
import { getTrackTitle, getTrackArtists, formatTime } from "@side-a/shared/utils";
import type { Track } from "@side-a/shared/api/types";

const QueueItem = React.memo(function QueueItem({
  track,
  index,
  isCurrent,
  onPress,
  onRemove,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  const coverUrl = api.getCoverUrl(track.album?.cover ?? track.album?.id ?? "", "160");

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-3 gap-3 ${isCurrent ? "bg-sf-text/5" : ""}`}
    >
      <Image
        source={{ uri: coverUrl }}
        style={{ width: 40, height: 40, borderRadius: 4 }}
        contentFit="cover"
      />
      <View className="flex-1 min-w-0">
        <Text
          className={`text-[15px] ${isCurrent ? "text-sf-blue font-medium" : "text-sf-text"}`}
          numberOfLines={1}
        >
          {getTrackTitle(track)}
        </Text>
        <Text className="text-[12px] text-sf-text-2" numberOfLines={1}>
          {getTrackArtists(track)}
        </Text>
      </View>
      <Text className="text-[11px] text-sf-text-2 tabular-nums">
        {formatTime(track.duration)}
      </Text>
    </Pressable>
  );
});

export function QueueList() {
  const { queue, queueIndex, playAlbum, removeFromQueue } = useAudio();

  if (queue.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-sf-text-2 text-[15px]">Queue is empty</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={queue}
      renderItem={({ item, index }) => (
        <QueueItem
          track={item}
          index={index}
          isCurrent={index === queueIndex}
          onPress={() => playAlbum(queue, index)}
          onRemove={() => removeFromQueue(index)}
        />
      )}
      keyExtractor={(item, index) => `${item.id}-${index}`}
    />
  );
}
