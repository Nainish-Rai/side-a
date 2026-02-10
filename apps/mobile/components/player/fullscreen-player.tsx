import React, { useState, useRef, useCallback } from "react";
import { useWindowDimensions, LayoutChangeEvent } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View, Text, Pressable } from "@/src/tw";
import { useRouter } from "expo-router";
import { useAudio } from "@/contexts/audio-context";
import { useLibrary } from "@/contexts/library-context";
import { useHaptics } from "@/hooks/use-haptics";
import { api } from "@/lib/api";
import { formatTime, getTrackTitle, getTrackArtists } from "@side-a/shared/utils";
import { ProgressBar } from "./progress-bar";
import { SymbolView } from "expo-symbols";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type RepeatMode = "off" | "all" | "one";

function VolumeSlider({
  volume,
  onVolumeChange,
}: {
  volume: number;
  onVolumeChange: (v: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const widthRef = useRef(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setTrackWidth(w);
  }, []);

  const tapGesture = Gesture.Tap().onEnd((e) => {
    if (widthRef.current > 0) {
      onVolumeChange(Math.max(0, Math.min(1, e.x / widthRef.current)));
    }
  });

  const panGesture = Gesture.Pan().onUpdate((e) => {
    if (widthRef.current > 0) {
      onVolumeChange(Math.max(0, Math.min(1, e.x / widthRef.current)));
    }
  });

  const composed = Gesture.Race(tapGesture, panGesture);
  const filledWidth = trackWidth * volume;
  const thumbSize = 10;
  const thumbLeft = Math.max(
    0,
    Math.min(filledWidth - thumbSize / 2, trackWidth - thumbSize)
  );

  return (
    <GestureDetector gesture={composed}>
      <View
        onLayout={onLayout}
        style={{ flex: 1, height: 24, justifyContent: "center" }}
      >
        <View
          style={{
            height: 3,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 1.5,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 3,
              width: filledWidth,
              backgroundColor: "rgba(255,255,255,0.5)",
              borderRadius: 1.5,
            }}
          />
        </View>
        {trackWidth > 0 && (
          <View
            style={{
              position: "absolute",
              left: thumbLeft,
              top: (24 - thumbSize) / 2,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: "#fff",
            }}
          />
        )}
      </View>
    </GestureDetector>
  );
}

export function FullscreenPlayer() {
  const router = useRouter();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
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
    volume,
    setVolume,
  } = useAudio();

  if (!currentTrack) return null;

  const coverUrl = api.getCoverUrl(
    currentTrack.album?.cover ?? currentTrack.album?.id ?? "",
    "1280"
  );

  const artSize = screenWidth - 48;
  const repeatIcon = repeatMode === "one" ? "repeat.1" : "repeat";
  const repeatTint = repeatMode !== "off" ? "label" : "secondaryLabel";

  const cycleRepeat = () => {
    const modes: RepeatMode[] = ["off", "all", "one"];
    const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    setRepeatMode(next);
  };

  return (
    <View
      className="flex-1 bg-black"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-3">
        <Pressable
          onPress={() => router.back()}
          className="p-2"
          hitSlop={8}
        >
          <SymbolView
            name="chevron.down"
            size={18}
            tintColor="secondaryLabel"
          />
        </Pressable>
        <Text className="text-[10px] font-mono uppercase tracking-widest text-white/40">
          NOW PLAYING
        </Text>
        <Pressable className="p-2" hitSlop={8}>
          <SymbolView name="ellipsis" size={18} tintColor="secondaryLabel" />
        </Pressable>
      </View>

      {/* Main content */}
      <View className="flex-1 px-6 justify-center gap-6">
        {/* Album Art */}
        <Image
          source={{ uri: coverUrl }}
          style={{
            width: artSize,
            height: artSize,
            borderRadius: 8,
            alignSelf: "center",
          }}
          contentFit="cover"
          transition={300}
        />

        {/* Track Info + Favorite */}
        <View className="gap-1">
          <View className="flex-row items-start justify-between gap-4">
            <Text
              className="flex-1 text-[22px] font-semibold text-white"
              numberOfLines={1}
            >
              {getTrackTitle(currentTrack)}
            </Text>
            <Pressable
              onPress={() => {
                toggleFavorite(currentTrack);
                haptics.success();
              }}
              className="p-1 mt-1"
              hitSlop={8}
            >
              <SymbolView
                name={isFavorite(currentTrack.id) ? "heart.fill" : "heart"}
                size={22}
                tintColor={
                  isFavorite(currentTrack.id) ? "systemRed" : "secondaryLabel"
                }
              />
            </Pressable>
          </View>
          <Text className="text-[15px] text-white/50" numberOfLines={1}>
            {getTrackArtists(currentTrack)}
          </Text>
        </View>

        {/* Progress */}
        <View className="gap-1">
          <ProgressBar
            position={position}
            duration={duration}
            onSeek={seekTo}
          />
          <View className="flex-row justify-between">
            <Text className="text-[12px] font-mono text-white/40 tabular-nums">
              {formatTime(position)}
            </Text>
            <Text className="text-[12px] font-mono text-white/40 tabular-nums">
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Transport Controls */}
        <View className="flex-row items-center justify-between px-2">
          <Pressable
            onPress={() => {
              toggleShuffle();
              haptics.selection();
            }}
            className="p-3"
            hitSlop={8}
          >
            <SymbolView
              name="shuffle"
              size={20}
              tintColor={shuffleActive ? "label" : "secondaryLabel"}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              skipPrevious();
              haptics.light();
            }}
            className="p-3"
            hitSlop={8}
          >
            <SymbolView name="backward.fill" size={28} tintColor="label" />
          </Pressable>
          <Pressable
            onPress={() => {
              togglePlayPause();
              haptics.light();
            }}
            className="bg-white rounded-full items-center justify-center"
            style={{ width: 64, height: 64 }}
          >
            <SymbolView
              name={isPlaying ? "pause.fill" : "play.fill"}
              size={28}
              tintColor="systemBackground"
            />
          </Pressable>
          <Pressable
            onPress={() => {
              skipNext();
              haptics.light();
            }}
            className="p-3"
            hitSlop={8}
          >
            <SymbolView name="forward.fill" size={28} tintColor="label" />
          </Pressable>
          <Pressable
            onPress={() => {
              cycleRepeat();
              haptics.selection();
            }}
            className="p-3"
            hitSlop={8}
          >
            <SymbolView
              name={repeatIcon}
              size={20}
              tintColor={repeatTint}
            />
          </Pressable>
        </View>
      </View>

      {/* Volume */}
      <View className="flex-row items-center px-6 pb-2 gap-3">
        <SymbolView name="speaker.fill" size={14} tintColor="secondaryLabel" />
        <VolumeSlider volume={volume} onVolumeChange={setVolume} />
        <SymbolView
          name="speaker.wave.3.fill"
          size={14}
          tintColor="secondaryLabel"
        />
      </View>
    </View>
  );
}
