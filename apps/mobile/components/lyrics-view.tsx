import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView as RNScrollView, ActivityIndicator } from "react-native";
import { View, Text, ScrollView } from "@/src/tw";
import { Image } from "@/src/tw/image";
import { usePlayerStore } from "@/stores/player-store";
import { api } from "@/lib/api";
import { useProgress } from "react-native-track-player";
import { getTrackTitle, getTrackArtists } from "@side-a/shared";
import type { SyncedLyric } from "@side-a/shared/api/types";

const LINE_HEIGHT = 32;

export function LyricsView() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { position } = useProgress(500);
  const [lyrics, setLyrics] = useState<SyncedLyric[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<RNScrollView>(null);
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
    <View className="flex-1">
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="w-12 h-12 overflow-hidden bg-white/5">
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              className="w-full h-full object-cover"
              transition={200}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Image
                source="sf:music.note"
                className="w-6 h-6"
                tintColor="rgba(255,255,255,0.2)"
              />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-white text-[14px] font-semibold" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-white/50 text-[12px]" numberOfLines={1}>
            {artists}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 items-center justify-center pt-20">
            <ActivityIndicator color="rgba(255,255,255,0.5)" />
          </View>
        ) : lyrics.length === 0 ? (
          <View className="flex-1 items-center justify-center pt-20">
            <Text className="text-white/30 text-base">No lyrics available</Text>
          </View>
        ) : (
          lyrics.map((line, i) => (
            <Text
              key={i}
              className={
                i === activeIndex
                  ? "text-white text-lg font-bold py-1 px-6"
                  : "text-white/30 text-base py-1 px-6"
              }
            >
              {line.text || "\u00A0"}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}
