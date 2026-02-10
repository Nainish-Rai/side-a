import { View, Text, Pressable } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { usePlayerStore } from "@/stores/player-store";
import { api } from "@/lib/api";
import { getTrackTitle, getTrackArtists, deriveTrackQuality } from "@side-a/shared";
import * as Haptics from "expo-haptics";
import { Dimensions } from "react-native";

interface FullscreenPlayerProps {
  onCollapse: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ART_SIZE = Math.min(SCREEN_WIDTH - 48, 300);

function haptic() {
  if (process.env.EXPO_OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function FullscreenPlayer({ onCollapse }: FullscreenPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrev = usePlayerStore((s) => s.skipPrev);
  const showLyrics = usePlayerStore((s) => s.showLyrics);
  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);

  if (!currentTrack) return null;

  const title = getTrackTitle(currentTrack);
  const artists = getTrackArtists(currentTrack);
  const quality = deriveTrackQuality(currentTrack);
  const coverUrl = currentTrack.album?.cover
    ? api.getCoverUrl(currentTrack.album.cover, "640")
    : null;

  return (
    <View className="flex-1 bg-black pt-3 pb-10">
      <Pressable onPress={onCollapse} className="items-center mt-3">
        <View className="w-9 h-[5px] rounded-full bg-white/30" />
      </Pressable>

      <View className="items-center mt-8 mb-6">
        <View
          className="border border-white/10 overflow-hidden"
          style={{ width: ART_SIZE, height: ART_SIZE }}
        >
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              className="w-full h-full object-cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-white/5">
              <Image
                source="sf:music.note"
                className="w-12 h-12"
                tintColor="rgba(255,255,255,0.2)"
              />
            </View>
          )}
        </View>
      </View>

      <Text className="text-white text-lg font-bold text-center px-6" numberOfLines={1}>
        {title}
      </Text>
      <Text className="text-white/50 text-sm text-center px-6 mt-1" numberOfLines={1}>
        {artists}
      </Text>

      {quality && (
        <View className="self-center mt-2 px-1.5 py-0.5 border border-white/20">
          <Text className="text-[8px] font-bold font-mono text-white/50 uppercase tracking-wider">
            {quality === "HI_RES_LOSSLESS" ? "HI-RES" : quality}
          </Text>
        </View>
      )}

      <View className="h-12 mt-6 px-6" />

      <View className="flex-row items-center justify-center gap-8 mt-4">
        <Pressable
          onPress={() => {
            haptic();
            skipPrev();
          }}
          className="active:opacity-60"
        >
          <Image
            source="sf:backward.fill"
            className="w-7 h-7"
            tintColor="white"
          />
        </Pressable>

        <Pressable
          onPress={() => {
            haptic();
            togglePlayback();
          }}
          className="active:opacity-60"
        >
          <Image
            source={isPlaying ? "sf:pause.fill" : "sf:play.fill"}
            className="w-11 h-11"
            tintColor="white"
          />
        </Pressable>

        <Pressable
          onPress={() => {
            haptic();
            skipNext();
          }}
          className="active:opacity-60"
        >
          <Image
            source="sf:forward.fill"
            className="w-7 h-7"
            tintColor="white"
          />
        </Pressable>
      </View>

      <View className="items-center mt-8">
        <Pressable
          onPress={() => {
            haptic();
            toggleLyrics();
          }}
          className="active:opacity-60"
        >
          <Image
            source="sf:quote.bubble"
            className="w-[22px] h-[22px]"
            tintColor="rgba(255,255,255,0.5)"
          />
        </Pressable>
      </View>
    </View>
  );
}
