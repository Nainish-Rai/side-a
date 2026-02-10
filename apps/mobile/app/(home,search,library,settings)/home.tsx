import { useState, useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { View, Text, ScrollView } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { TrackRow } from "@/components/track-row";
import { useSearchTracks } from "@/hooks/use-search";
import { useRecentlyPlayed } from "@/hooks/use-recently-played";
import type { Track } from "@side-a/shared/api/types";

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigation = useNavigation();
  const {
    results,
    loading: searchLoading,
    total,
  } = useSearchTracks(searchQuery);
  const {
    tracks: recentTracks,
    loading: recentLoading,
    add,
  } = useRecentlyPlayed();

  useEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: "Search music...",
        autoCapitalize: "none",
        hideWhenScrolling: false,
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
    add(track);
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
        <RecentlyPlayedSection
          tracks={recentTracks}
          loading={recentLoading}
          onTrackPress={handleTrackPress}
        />
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
        <EmptyState
          icon="sf:magnifyingglass"
          title="NO RESULTS"
          subtitle="Try different keywords"
        />
      ) : (
        results.map((track) => (
          <TrackRow key={track.id} track={track} onPress={onTrackPress} />
        ))
      )}
    </View>
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
        <EmptyState
          icon="sf:music.note.list"
          title="NO RECENT TRACKS"
          subtitle="Search and play music to see it here"
        />
      ) : (
        tracks.map((track) => (
          <TrackRow key={track.id} track={track} onPress={onTrackPress} />
        ))
      )}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <View className="items-center border border-white/10 px-10 py-8 w-full max-w-[300px]">
        <Image
          source={icon}
          className="w-8 h-8 mb-3"
          tintColor="rgba(255,255,255,0.2)"
        />
        <Text className="text-xs font-semibold font-mono uppercase tracking-[1.5px] text-white/90 mb-1">
          {title}
        </Text>
        <Text className="text-[10px] font-mono uppercase tracking-wider text-white/40 text-center">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
