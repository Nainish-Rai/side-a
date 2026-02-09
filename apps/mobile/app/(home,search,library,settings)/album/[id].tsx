import { useCallback, useLayoutEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { ScrollView, View, Text } from "@/src/tw";
import { useAlbum } from "@/hooks/use-album";
import { useAudio } from "@/contexts/audio-context";
import { AlbumHeader } from "@/components/album/album-header";
import { TrackList } from "@/components/album/track-list";
import type { Track } from "@side-a/shared/api/types";

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const albumId = Number(id);
  const navigation = useNavigation();
  const { data, isLoading, error } = useAlbum(albumId);
  const { playAlbum, currentTrack, isPlaying } = useAudio();

  useLayoutEffect(() => {
    if (data?.album) {
      navigation.setOptions({ title: data.album.title });
    }
  }, [navigation, data?.album]);

  const isAlbumPlaying = isPlaying && (data?.tracks?.some(
    (t) => t.id === currentTrack?.id
  ) ?? false);

  const handlePlayAlbum = useCallback(() => {
    if (data?.tracks?.length) {
      playAlbum(data.tracks, 0);
    }
  }, [data?.tracks, playAlbum]);

  const handleTrackPress = useCallback((track: Track, index: number) => {
    if (data?.tracks?.length) {
      playAlbum(data.tracks, index);
    }
  }, [data?.tracks, playAlbum]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-sf-red text-[15px] text-center">
          Failed to load album
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <AlbumHeader
        album={data.album}
        tracks={data.tracks}
        onPlayAlbum={handlePlayAlbum}
        isAlbumPlaying={isAlbumPlaying}
      />
      <TrackList
        tracks={data.tracks}
        onTrackPress={handleTrackPress}
      />
    </ScrollView>
  );
}
