import React from "react";
import { Image } from "expo-image";
import { View, Text, Pressable } from "@/src/tw";
import { useRouter } from "expo-router";
import { useAudio } from "@/contexts/audio-context";
import { useHaptics } from "@/hooks/use-haptics";
import { api } from "@/lib/api";
import { getTrackTitle, getTrackArtists } from "@side-a/shared/utils";
import { SymbolView } from "expo-symbols";

export function MiniPlayer() {
  const router = useRouter();
  const haptics = useHaptics();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    skipNext,
    position,
    duration,
  } = useAudio();

  if (!currentTrack) return null;

  const coverUrl = api.getCoverUrl(
    currentTrack.album?.cover ?? currentTrack.album?.id ?? "",
    "160"
  );
  const progress = duration > 0 ? position / duration : 0;

  return (
    <Pressable
      onPress={() => router.push("/player")}
      className="bg-sf-bg-2 mx-2 rounded-2xl overflow-hidden"
    >
      <View className="h-0.5 bg-sf-text/10">
        <View
          className="h-full bg-sf-text"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-row items-center px-3 py-2 gap-3">
        <Image
          source={{ uri: coverUrl }}
          style={{ width: 40, height: 40, borderRadius: 6 }}
          contentFit="cover"
        />
        <View className="flex-1 min-w-0">
          <Text
            className="text-[14px] font-medium text-sf-text"
            numberOfLines={1}
          >
            {getTrackTitle(currentTrack)}
          </Text>
          <Text className="text-[12px] text-sf-text-2" numberOfLines={1}>
            {getTrackArtists(currentTrack)}
          </Text>
        </View>
        <Pressable onPress={() => { togglePlayPause(); haptics.light(); }} className="p-2" hitSlop={8}>
          <SymbolView
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={22}
            tintColor="label"
          />
        </Pressable>
        <Pressable onPress={() => { skipNext(); haptics.light(); }} className="p-2" hitSlop={8}>
          <SymbolView
            name="forward.fill"
            size={20}
            tintColor="secondaryLabel"
          />
        </Pressable>
      </View>
    </Pressable>
  );
}
