import { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { usePlayerStore } from "@/stores/player-store";
import { api } from "@/lib/api";
import { getTrackTitle, getTrackArtists } from "@side-a/shared";
import type { SyncedLyric } from "@side-a/shared/api/types";

const LINE_HEIGHT = 32;

export function LyricsView() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const position = usePlayerStore((s) => s.position);
  const [lyrics, setLyrics] = useState<SyncedLyric[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    if (!currentTrack) {
      setLyrics([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLyrics([]);

    api.fetchLyrics(currentTrack).then((data) => {
      if (cancelled) return;
      setLyrics(data?.parsed ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id]);

  const activeIndex = lyrics.length > 0
    ? lyrics.reduce((acc, lyric, i) => (lyric.time <= position ? i : acc), -1)
    : -1;

  useEffect(() => {
    if (activeIndex >= 0 && activeIndex !== activeIndexRef.current) {
      activeIndexRef.current = activeIndex;
      scrollViewRef.current?.scrollTo({
        y: activeIndex * LINE_HEIGHT,
        animated: true,
      });
    }
  }, [activeIndex]);

  if (!currentTrack) return null;

  const title = getTrackTitle(currentTrack);
  const artists = getTrackArtists(currentTrack);
  const coverUrl = currentTrack.album?.cover
    ? api.getCoverUrl(currentTrack.album.cover, "160")
    : null;

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            overflow: "hidden",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        >
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Image
                source="sf:music.note"
                style={{ width: 24, height: 24 }}
                tintColor="rgba(255,255,255,0.2)"
              />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {artists}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <ActivityIndicator color="rgba(255,255,255,0.5)" />
          </View>
        ) : lyrics.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 16 }}>
              No lyrics available
            </Text>
          </View>
        ) : (
          lyrics.map((line, i) => (
            <Text
              key={i}
              style={{
                lineHeight: LINE_HEIGHT,
                paddingHorizontal: 24,
                color: i === activeIndex ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: i === activeIndex ? 18 : 16,
                fontWeight: i === activeIndex ? "700" : "400",
              }}
            >
              {line.text || "\u00A0"}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}
