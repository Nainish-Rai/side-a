import { useCallback, useLayoutEffect } from "react";
import { ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter, useNavigation } from "expo-router";
import { View, Text, ScrollView, Pressable } from "@/src/tw";
import { useSearch, SearchTab } from "@/hooks/use-search";
import { TrackRow } from "@/components/search/track-row";
import { AlbumCard } from "@/components/search/album-card";
import { ArtistCard } from "@/components/search/artist-card";
import { useAudio } from "@/contexts/audio-context";
import type { Track, Album, Artist } from "@side-a/shared/api/types";

const TABS: { key: SearchTab; label: string }[] = [
  { key: "tracks", label: "Tracks" },
  { key: "albums", label: "Albums" },
  { key: "artists", label: "Artists" },
];

export default function SearchScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { playTrack } = useAudio();
  const {
    query,
    currentTab,
    setCurrentTab,
    handleSearch,
    tracks,
    albums,
    artists,
    isLoading,
    isFetchingMore,
    hasNextPage,
    fetchNextPage,
  } = useSearch();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        placeholder: "Artists, songs, albums",
        onChangeText: (event: { nativeEvent: { text: string } }) => {
          handleSearch(event.nativeEvent.text);
        },
        onCancelButtonPress: () => {
          handleSearch("");
        },
        autoCapitalize: "none",
        hideWhenScrolling: false,
      },
    });
  }, [navigation, handleSearch]);

  const handleTrackPress = useCallback((track: Track) => {
    playTrack(track);
  }, [playTrack]);

  const handleAlbumPress = useCallback(
    (album: Album) => {
      router.push(`/album/${album.id}`);
    },
    [router]
  );

  const handleArtistPress = useCallback((_artist: Artist) => {
    // TODO: artist detail screen
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingMore) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingMore, fetchNextPage]);

  const data = currentTab === "tracks" ? tracks : currentTab === "albums" ? albums : artists;

  const renderItem = useCallback(
    ({ item }: { item: Track | Album | Artist }) => {
      if (currentTab === "tracks") return <TrackRow track={item as Track} onPress={handleTrackPress} />;
      if (currentTab === "albums") return <AlbumCard album={item as Album} onPress={handleAlbumPress} />;
      return <ArtistCard artist={item as Artist} onPress={handleArtistPress} />;
    },
    [currentTab, handleTrackPress, handleAlbumPress, handleArtistPress]
  );

  return (
    <View className="flex-1">
      {query.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          className="border-b border-sf-text/10"
          contentContainerClassName="px-4 py-2 gap-2"
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setCurrentTab(tab.key)}
              className={`px-4 py-1.5 rounded-full ${
                currentTab === tab.key ? "bg-sf-text" : "bg-sf-bg-2"
              }`}
            >
              <Text
                className={`text-[13px] font-medium ${
                  currentTab === tab.key ? "text-sf-bg" : "text-sf-text-2"
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : data.length > 0 ? (
        <FlashList
          data={data}
          renderItem={renderItem}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          keyExtractor={(item) => String(item.id)}
          contentInsetAdjustmentBehavior="automatic"
          ListFooterComponent={
            isFetchingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      ) : query.length > 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sf-text-2 text-[15px]">No results found</Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-sf-text-2 text-[15px]">Search for music</Text>
        </View>
      )}
    </View>
  );
}
