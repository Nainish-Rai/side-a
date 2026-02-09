import React from "react";
import { Dimensions } from "react-native";
import { Image } from "expo-image";
import { View, Text, Pressable } from "@/src/tw";
import { useRouter } from "expo-router";
import { useAudio } from "@/contexts/audio-context";
import { useLibrary } from "@/contexts/library-context";
import { useHaptics } from "@/hooks/use-haptics";
import { api } from "@/lib/api";
import { formatTime, getTrackTitle, getTrackArtists } from "@side-a/shared/utils";
import { ProgressBar } from "./progress-bar";
import { SymbolView } from "expo-symbols";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ART_SIZE = SCREEN_WIDTH - 64;

type RepeatMode = "off" | "all" | "one";

export function FullscreenPlayer() {
  const router = useRouter();
  const haptics = useHaptics();
  const { isFavorite, toggleFavorite } = useLibrary();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seekTo,
    repeatMode,
    setRepeatMode,
    shuffleActive,
    toggleShuffle,
  } = useAudio();

  if (!currentTrack) return null;

  const coverUrl = api.getCoverUrl(
    currentTrack.album?.cover ?? currentTrack.album?.id ?? "",
    "1280"
  );

  const repeatIcon = repeatMode === "one" ? "repeat.1" : "repeat";
  const repeatTint = repeatMode !== "off" ? "systemBlue" : "secondaryLabel";

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  return (
    <View className="flex-1 px-8 justify-center gap-8">
      <View className="items-center">
        <Image
          source={{ uri: coverUrl }}
          style={{ width: ART_SIZE, height: ART_SIZE, borderRadius: 12 }}
          contentFit="cover"
          transition={300}
        />
      </View>

      <View className="gap-1">
        <Text
          className="text-xl font-semibold text-sf-text"
          numberOfLines={1}
        >
          {getTrackTitle(currentTrack)}
        </Text>
        <Text className="text-[15px] text-sf-text-2" numberOfLines={1}>
          {getTrackArtists(currentTrack)}
        </Text>
      </View>

      <View className="gap-1">
        <ProgressBar position={position} duration={duration} onSeek={seekTo} />
        <View className="flex-row justify-between">
          <Text className="text-[11px] text-sf-text-2 tabular-nums">
            {formatTime(position)}
          </Text>
          <Text className="text-[11px] text-sf-text-2 tabular-nums">
            -{formatTime(Math.max(0, duration - position))}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between px-4">
        <Pressable onPress={() => { toggleShuffle(); haptics.selection(); }} className="p-3" hitSlop={8}>
          <SymbolView
            name="shuffle"
            size={20}
            tintColor={shuffleActive ? "systemBlue" : "secondaryLabel"}
          />
        </Pressable>
        <Pressable onPress={() => { skipPrevious(); haptics.light(); }} className="p-3" hitSlop={8}>
          <SymbolView name="backward.fill" size={28} tintColor="label" />
        </Pressable>
        <Pressable
          onPress={() => { togglePlayPause(); haptics.light(); }}
          className="bg-sf-text rounded-full w-16 h-16 items-center justify-center"
        >
          <SymbolView
            name={isPlaying ? "pause.fill" : "play.fill"}
            size={28}
            tintColor="systemBackground"
          />
        </Pressable>
        <Pressable onPress={() => { skipNext(); haptics.light(); }} className="p-3" hitSlop={8}>
          <SymbolView name="forward.fill" size={28} tintColor="label" />
        </Pressable>
        <Pressable onPress={() => { cycleRepeat(); haptics.selection(); }} className="p-3" hitSlop={8}>
          <SymbolView name={repeatIcon} size={20} tintColor={repeatTint} />
        </Pressable>
      </View>

      {/* Favorite + Lyrics */}
      <View className="flex-row items-center justify-center gap-8">
        <Pressable
          onPress={() => {
            if (currentTrack) {
              toggleFavorite(currentTrack);
              haptics.success();
            }
          }}
          className="p-3"
          hitSlop={8}
        >
          <SymbolView
            name={currentTrack && isFavorite(currentTrack.id) ? "heart.fill" : "heart"}
            size={22}
            tintColor={currentTrack && isFavorite(currentTrack.id) ? "systemRed" : "secondaryLabel"}
          />
        </Pressable>
        <Pressable
          onPress={() => router.push("/lyrics")}
          className="p-3"
          hitSlop={8}
        >
          <SymbolView name="quote.bubble" size={22} tintColor="secondaryLabel" />
        </Pressable>
      </View>
    </View>
  );
}
