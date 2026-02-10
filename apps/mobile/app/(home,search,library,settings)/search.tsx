import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { useNavigation } from "expo-router";
import { Image } from "expo-image";
import { TrackRow } from "@/components/track-row";
import { useSearchTracks } from "@/hooks/use-search";
import { usePlayerStore } from "@/stores/player-store";
import type { Track } from "@side-a/shared/api/types";

const MONO_FONT = process.env.EXPO_OS === "ios" ? "ui-monospace" : "monospace";

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

  const handleTrackPress = useCallback((track: Track) => {
    playTrack(track, results);
  }, [playTrack, results]);

  const renderItem = useCallback(({ item }: { item: Track }) => (
    <TrackRow track={item} onPress={handleTrackPress} />
  ), [handleTrackPress]);

  const keyExtractor = useCallback((item: Track) => String(item.id), []);

  const isSearching = searchQuery.trim().length > 0;

  if (!isSearching) {
    return <SearchPrompt />;
  }

  return (
    <FlatList
      data={results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ paddingBottom: 96 }}
      keyboardDismissMode="on-drag"
      ListHeaderComponent={
        <SearchHeader loading={searchLoading} total={total} />
      }
      ListEmptyComponent={
        searchLoading ? <LoadingState /> : <EmptySearchState />
      }
    />
  );
}

function SearchPrompt() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 64,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            paddingHorizontal: 40,
            paddingVertical: 32,
            width: "100%",
            maxWidth: 300,
          }}
        >
          <Image
            source="sf:magnifyingglass"
            style={{ width: 32, height: 32, marginBottom: 12 }}
            tintColor="rgba(255,255,255,0.2)"
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              fontFamily: MONO_FONT,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 4,
            }}
          >
            SEARCH MUSIC
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontFamily: MONO_FONT,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "rgba(255,255,255,0.4)",
              textAlign: "center",
            }}
          >
            Find tracks, albums, and artists
          </Text>
        </View>
      </View>
    </View>
  );
}

function SearchHeader({ loading, total }: { loading: boolean; total: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          fontFamily: MONO_FONT,
          textTransform: "uppercase",
          letterSpacing: 1.5,
          color: "rgba(255,255,255,0.4)",
        }}
      >
        {loading ? "SEARCHING..." : `${total} RESULTS`}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={{ paddingVertical: 40, alignItems: "center" }}>
      <ActivityIndicator color="rgba(255,255,255,0.5)" />
    </View>
  );
}

function EmptySearchState() {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
          paddingHorizontal: 40,
          paddingVertical: 32,
          width: "100%",
          maxWidth: 300,
        }}
      >
        <Image
          source="sf:magnifyingglass"
          style={{ width: 32, height: 32, marginBottom: 12 }}
          tintColor="rgba(255,255,255,0.2)"
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            fontFamily: MONO_FONT,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 4,
          }}
        >
          NO RESULTS
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: MONO_FONT,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "rgba(255,255,255,0.4)",
            textAlign: "center",
          }}
        >
          Try different keywords
        </Text>
      </View>
    </View>
  );
}
