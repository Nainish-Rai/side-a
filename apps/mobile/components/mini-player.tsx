import { View, Text, Pressable } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { usePlayerStore } from "@/stores/player-store";
import { api } from "@/lib/api";
import { getTrackTitle, getTrackArtists } from "@side-a/shared";
import * as Haptics from "expo-haptics";

interface MiniPlayerProps {
  onExpand: () => void;
}

export function MiniPlayer({ onExpand }: MiniPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);

  if (!currentTrack) return null;

  const coverUrl = currentTrack.album?.cover
    ? api.getCoverUrl(currentTrack.album.cover, "160")
    : null;
  const title = getTrackTitle(currentTrack);
  const artists = getTrackArtists(currentTrack);
  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleTogglePlayback = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    togglePlayback();
  };

  const handleSkipNext = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    skipNext();
  };

  return (
    <Pressable onPress={onExpand} className="bg-black border-t border-white/10">
      <View className="h-16 flex-row items-center px-3 gap-3">
        <View className="w-12 h-12 bg-white/5 overflow-hidden">
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              className="w-12 h-12 object-cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Image
                source="sf:music.note"
                className="w-5 h-5"
                tintColor="rgba(255,255,255,0.2)"
              />
            </View>
          )}
        </View>

        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-white text-[14px] font-semibold">
            {title}
          </Text>
          <Text numberOfLines={1} className="text-white/50 text-[12px]">
            {artists}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleTogglePlayback();
            }}
            className="p-2"
          >
            <Image
              source={isPlaying ? "sf:pause.fill" : "sf:play.fill"}
              className="w-5 h-5"
              tintColor="white"
            />
          </Pressable>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleSkipNext();
            }}
            className="p-2"
          >
            <Image
              source="sf:forward.fill"
              className="w-[18px] h-[18px]"
              tintColor="rgba(255,255,255,0.6)"
            />
          </Pressable>
        </View>
      </View>

      <View className="h-[2px] bg-white/10 w-full">
        <View
          className="bg-white/60 h-full"
          style={{ width: `${progressPercent}%` }}
        />
      </View>
    </Pressable>
  );
}
