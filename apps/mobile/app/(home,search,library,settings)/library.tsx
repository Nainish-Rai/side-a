import { useCallback } from "react";
import { Image } from "expo-image";
import { View, Text, ScrollView, Pressable } from "@/src/tw";
import { useLibrary } from "@/contexts/library-context";
import { useAudio } from "@/contexts/audio-context";
import { api } from "@/lib/api";
import { formatTime, getTrackTitle, getTrackArtists, hasExplicitContent } from "@side-a/shared";
import type { Track } from "@side-a/shared/api/types";

function LibraryTrackRow({ track, onPress, isPlaying }: { track: Track; onPress: (t: Track) => void; isPlaying: boolean }) {
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
}

export default function LibraryScreen() {
  const { favorites } = useLibrary();
  const { playTrack, currentTrack } = useAudio();

  const handleTrackPress = useCallback(
    (track: Track) => {
      playTrack(track);
    },
    [playTrack]
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-[11px] uppercase tracking-widest text-sf-text-2">
          Favorites ({favorites.length})
        </Text>
      </View>
      {favorites.length > 0 ? (
        favorites.map((track) => (
          <LibraryTrackRow
            key={track.id}
            track={track}
            onPress={handleTrackPress}
            isPlaying={currentTrack?.id === track.id}
          />
        ))
      ) : (
        <View className="px-4 py-8 items-center">
          <Text className="text-sf-text-2 text-[15px]">No favorites yet</Text>
        </View>
      )}
    </ScrollView>
  );
}
