import React from "react";
import { View, Text, Pressable } from "@/src/tw";
import { formatTime, getTrackTitle, hasExplicitContent } from "@side-a/shared";
import type { Track } from "@side-a/shared/api/types";

interface TrackListProps {
  tracks: Track[];
  currentTrackId?: number;
  onTrackPress: (track: Track, index: number) => void;
}

const TrackItem = React.memo(function TrackItem({
  track,
  index,
  isCurrent,
  onPress,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  onPress: (track: Track, index: number) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(track, index)}
      className={`flex-row items-center px-6 py-3 gap-3 ${isCurrent ? "bg-sf-text/5" : ""}`}
    >
      <Text
        className={`w-8 text-center text-[13px] ${
          isCurrent ? "text-sf-blue" : "text-sf-text-2"
        }`}
      >
        {track.trackNumber ?? index + 1}
      </Text>
      <View className="flex-1 min-w-0">
        <Text
          className={`text-[15px] ${isCurrent ? "text-sf-blue font-medium" : "text-sf-text"}`}
          numberOfLines={1}
        >
          {getTrackTitle(track)}
        </Text>
        {hasExplicitContent(track) && (
          <View className="flex-row items-center">
            <View className="bg-sf-text/20 rounded px-1 mt-0.5">
              <Text className="text-[9px] font-bold text-sf-text/60">E</Text>
            </View>
          </View>
        )}
      </View>
      <Text className="text-[12px] text-sf-text-2 tabular-nums">
        {formatTime(track.duration)}
      </Text>
    </Pressable>
  );
});

export function TrackList({ tracks, currentTrackId, onTrackPress }: TrackListProps) {
  return (
    <View>
      {tracks.map((track, index) => (
        <TrackItem
          key={track.id}
          track={track}
          index={index}
          isCurrent={currentTrackId === track.id}
          onPress={onTrackPress}
        />
      ))}
    </View>
  );
}
