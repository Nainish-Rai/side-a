import { ActivityIndicator } from "react-native";
import { View, Text } from "@/src/tw";
import { useAudio } from "@/contexts/audio-context";
import { useLyrics } from "@/hooks/use-lyrics";
import { LyricsView } from "@/components/lyrics/lyrics-view";

export default function LyricsScreen() {
  const { currentTrack, position, isPlaying } = useAudio();
  const { lyrics, currentLineIndex, isLoading, hasSyncedLyrics } = useLyrics(
    currentTrack,
    position,
    isPlaying
  );

  if (!currentTrack) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-sf-text-2">No track playing</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!hasSyncedLyrics) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sf-text-2 text-[15px] text-center">
          No lyrics available for this track
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 pt-4">
      <LyricsView lines={lyrics!.parsed!} currentLineIndex={currentLineIndex} />
    </View>
  );
}
