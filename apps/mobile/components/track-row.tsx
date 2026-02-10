import { View, Text, Pressable } from "@/src/tw";
import { Image } from "@/src/tw/image";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";
import {
  formatTime,
  getTrackTitle,
  getTrackArtists,
  deriveTrackQuality,
} from "@side-a/shared";
import type { Track } from "@side-a/shared/api/types";

interface TrackRowProps {
  track: Track;
  onPress?: (track: Track) => void;
  showQuality?: boolean;
}

export function TrackRow({
  track,
  onPress,
  showQuality = true,
}: TrackRowProps) {
  const coverUrl = track.album?.cover
    ? api.getCoverUrl(track.album.cover, "160")
    : null;
  const quality = deriveTrackQuality(track);
  const title = getTrackTitle(track);
  const artists = getTrackArtists(track);
  const duration = formatTime(track.duration);

  const handlePress = () => {
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(track);
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center px-4 py-3 gap-3 border-b border-white/10 active:opacity-60"
    >
      {/* Cover Art — square, no rounded corners per design language */}
      <View className="w-12 h-12 bg-white/5 border border-white/10 overflow-hidden">
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

      {/* Title + Artist */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text
            numberOfLines={1}
            className="flex-1 text-white/90 text-[15px] font-medium"
          >
            {title}
          </Text>
          {track.explicit && (
            <View className="px-1 py-px border border-white/20">
              <Text className="text-[9px] font-bold font-mono text-white/50 uppercase">
                E
              </Text>
            </View>
          )}
        </View>
        <Text numberOfLines={1} className="text-white/50 text-[13px]">
          {artists}
        </Text>
      </View>

      {/* Quality badge + Duration */}
      <View className="items-end gap-1">
        {showQuality && quality && (
          <View className="px-1.5 py-0.5 border border-white/20">
            <Text className="text-[8px] font-bold font-mono text-white/50 uppercase tracking-wider">
              {quality === "HI_RES_LOSSLESS" ? "HI-RES" : quality}
            </Text>
          </View>
        )}
        <Text className="text-white/40 text-xs font-mono tabular-nums">
          {duration}
        </Text>
      </View>
    </Pressable>
  );
}
