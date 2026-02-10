import { ActivityIndicator } from "react-native";
import { View, Text, ScrollView } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { TrackRow } from "@/components/track-row";
import { useRecentlyPlayed } from "@/hooks/use-recently-played";
import type { Track } from "@side-a/shared/api/types";

export default function HomeScreen() {
  const {
    tracks: recentTracks,
    loading: recentLoading,
    add,
  } = useRecentlyPlayed();

  const handleTrackPress = (track: Track) => {
    add(track);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-black"
      contentContainerClassName="pb-24"
    >
      <RecentlyPlayedSection
        tracks={recentTracks}
        loading={recentLoading}
        onTrackPress={handleTrackPress}
      />
    </ScrollView>
  );
}

function RecentlyPlayedSection({
  tracks,
  loading,
  onTrackPress,
}: {
  tracks: Track[];
  loading: boolean;
  onTrackPress: (track: Track) => void;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between px-4 pt-5 pb-3 border-b border-white/10">
        <Text className="text-[11px] font-bold font-mono uppercase tracking-[2px] text-white/40">
          RECENTLY PLAYED
        </Text>
        {tracks.length > 0 && (
          <Text className="text-[11px] font-mono text-white/30 tabular-nums">
            {tracks.length}
          </Text>
        )}
      </View>

      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="rgba(255,255,255,0.5)" />
        </View>
      ) : tracks.length === 0 ? (
        <View className="items-center justify-center py-16 px-6">
          <View className="items-center border border-white/10 px-10 py-8 w-full max-w-[300px]">
            <Image
              source="sf:music.note.list"
              className="w-8 h-8 mb-3"
              tintColor="rgba(255,255,255,0.2)"
            />
            <Text className="text-xs font-semibold font-mono uppercase tracking-[1.5px] text-white/90 mb-1">
              NO RECENT TRACKS
            </Text>
            <Text className="text-[10px] font-mono uppercase tracking-wider text-white/40 text-center">
              Search and play music to see it here
            </Text>
          </View>
        </View>
      ) : (
        tracks.map((track) => (
          <TrackRow key={track.id} track={track} onPress={onTrackPress} />
        ))
      )}
    </View>
  );
}
