import { useState, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { View, Text, ScrollView } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { TrackRow } from "@/components/track-row";
import { useSearchTracks } from "@/hooks/use-search";
import { usePlayerStore } from "@/stores/player-store";
import type { Track } from "@side-a/shared/api/types";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const {
    results,
    loading: searchLoading,
    total,
  } = useSearchTracks(searchQuery);
  const playTrack = usePlayerStore((s) => s.playTrack);

  useEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: "Search music...",
        autoCapitalize: "none",
        hideWhenScrolling: false,
        textColor: "#fff",
        tintColor: "#fff",
        hintTextColor: "rgba(255,255,255,0.4)",
        headerIconColor: "#fff",
        onChangeText: (e: { nativeEvent: { text: string } }) => {
          setSearchQuery(e.nativeEvent.text);
        },
        onCancelButtonPress: () => {
          setSearchQuery("");
        },
      },
    });
  }, [navigation]);

  const handleTrackPress = (track: Track) => {
    playTrack(track, results);
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-black"
      contentContainerClassName="pb-24"
      keyboardDismissMode="on-drag"
    >
      {isSearching ? (
        <SearchResultsSection
          results={results}
          loading={searchLoading}
          total={total}
          onTrackPress={handleTrackPress}
        />
      ) : (
        <View className="items-center justify-center py-16 px-6">
          <View className="items-center border border-white/10 px-10 py-8 w-full max-w-[300px]">
            <Image
              source="sf:magnifyingglass"
              className="w-8 h-8 mb-3"
              tintColor="rgba(255,255,255,0.2)"
            />
            <Text className="text-xs font-semibold font-mono uppercase tracking-[1.5px] text-white/90 mb-1">
              SEARCH MUSIC
            </Text>
            <Text className="text-[10px] font-mono uppercase tracking-wider text-white/40 text-center">
              Find tracks, albums, and artists
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SearchResultsSection({
  results,
  loading,
  total,
  onTrackPress,
}: {
  results: Track[];
  loading: boolean;
  total: number;
  onTrackPress: (track: Track) => void;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between px-4 pt-5 pb-3 border-b border-white/10">
        <Text className="text-[11px] font-bold font-mono uppercase tracking-[2px] text-white/40">
          {loading ? "SEARCHING..." : `${total} RESULTS`}
        </Text>
      </View>

      {loading ? (
        <View className="py-10 items-center">
          <ActivityIndicator color="rgba(255,255,255,0.5)" />
        </View>
      ) : results.length === 0 ? (
        <View className="items-center justify-center py-16 px-6">
          <View className="items-center border border-white/10 px-10 py-8 w-full max-w-[300px]">
            <Image
              source="sf:magnifyingglass"
              className="w-8 h-8 mb-3"
              tintColor="rgba(255,255,255,0.2)"
            />
            <Text className="text-xs font-semibold font-mono uppercase tracking-[1.5px] text-white/90 mb-1">
              NO RESULTS
            </Text>
            <Text className="text-[10px] font-mono uppercase tracking-wider text-white/40 text-center">
              Try different keywords
            </Text>
          </View>
        </View>
      ) : (
        results.map((track) => (
          <TrackRow key={track.id} track={track} onPress={onTrackPress} />
        ))
      )}
    </View>
  );
}
