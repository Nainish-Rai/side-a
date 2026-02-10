import { View, Text, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { usePlayerStore } from "@/stores/player-store";
import { api } from "@/lib/api";
import { getTrackTitle, getTrackArtists, deriveTrackQuality } from "@side-a/shared";
import * as Haptics from "expo-haptics";
import { SeekBar } from "@/components/seek-bar";
import { LyricsView } from "@/components/lyrics-view";

interface FullscreenPlayerProps {
  onCollapse: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ART_SIZE = Math.min(SCREEN_WIDTH - 48, 300);
const MONO_FONT = process.env.EXPO_OS === "ios" ? "ui-monospace" : "monospace";

function haptic() {
  if (process.env.EXPO_OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function FullscreenPlayer({ onCollapse }: FullscreenPlayerProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayback = usePlayerStore((s) => s.togglePlayback);
  const skipNext = usePlayerStore((s) => s.skipNext);
  const skipPrev = usePlayerStore((s) => s.skipPrev);
  const showLyrics = usePlayerStore((s) => s.showLyrics);
  const toggleLyrics = usePlayerStore((s) => s.toggleLyrics);

  if (!currentTrack) return null;

  const title = getTrackTitle(currentTrack);
  const artists = getTrackArtists(currentTrack);
  const quality = deriveTrackQuality(currentTrack);
  const coverUrl = currentTrack.album?.cover
    ? api.getCoverUrl(currentTrack.album.cover, "640")
    : null;

  if (showLyrics) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", paddingTop: 12, paddingBottom: 40 }}>
        <Pressable
          onPress={onCollapse}
          style={{ alignItems: "center", marginTop: 12 }}
        >
          <View
            style={{
              width: 36,
              height: 5,
              borderRadius: 9999,
              backgroundColor: "rgba(255,255,255,0.3)",
            }}
          />
        </Pressable>

        <LyricsView />

        <View style={{ marginTop: 16 }}>
          <SeekBar />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            marginTop: 16,
          }}
        >
          <Pressable
            onPress={() => { haptic(); skipPrev(); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Image source="sf:backward.fill" style={{ width: 28, height: 28 }} tintColor="white" />
          </Pressable>
          <Pressable
            onPress={() => { haptic(); togglePlayback(); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Image
              source={isPlaying ? "sf:pause.fill" : "sf:play.fill"}
              style={{ width: 44, height: 44 }}
              tintColor="white"
            />
          </Pressable>
          <Pressable
            onPress={() => { haptic(); skipNext(); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Image source="sf:forward.fill" style={{ width: 28, height: 28 }} tintColor="white" />
          </Pressable>
        </View>

        <View style={{ alignItems: "center", marginTop: 16 }}>
          <Pressable
            onPress={() => { haptic(); toggleLyrics(); }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Image source="sf:quote.bubble" style={{ width: 22, height: 22 }} tintColor="white" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000", paddingTop: 12, paddingBottom: 40 }}>
      <Pressable
        onPress={onCollapse}
        style={{ alignItems: "center", marginTop: 12 }}
      >
        <View
          style={{
            width: 36,
            height: 5,
            borderRadius: 9999,
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        />
      </Pressable>

      <View style={{ alignItems: "center", marginTop: 32, marginBottom: 24 }}>
        <View
          style={{
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            overflow: "hidden",
            width: ART_SIZE,
            height: ART_SIZE,
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
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Image
                source="sf:music.note"
                style={{ width: 48, height: 48 }}
                tintColor="rgba(255,255,255,0.2)"
              />
            </View>
          )}
        </View>
      </View>

      <Text
        style={{
          color: "#fff",
          fontSize: 18,
          fontWeight: "700",
          textAlign: "center",
          paddingHorizontal: 24,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 14,
          textAlign: "center",
          paddingHorizontal: 24,
          marginTop: 4,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {artists}
      </Text>

      {quality && (
        <View
          style={{
            alignSelf: "center",
            marginTop: 8,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.2)",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              fontFamily: MONO_FONT,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {quality === "HI_RES_LOSSLESS" ? "HI-RES" : quality}
          </Text>
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <SeekBar />
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          marginTop: 16,
        }}
      >
        <Pressable
          onPress={() => { haptic(); skipPrev(); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Image source="sf:backward.fill" style={{ width: 28, height: 28 }} tintColor="white" />
        </Pressable>

        <Pressable
          onPress={() => { haptic(); togglePlayback(); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Image
            source={isPlaying ? "sf:pause.fill" : "sf:play.fill"}
            style={{ width: 44, height: 44 }}
            tintColor="white"
          />
        </Pressable>

        <Pressable
          onPress={() => { haptic(); skipNext(); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Image source="sf:forward.fill" style={{ width: 28, height: 28 }} tintColor="white" />
        </Pressable>
      </View>

      <View style={{ alignItems: "center", marginTop: 32 }}>
        <Pressable
          onPress={() => { haptic(); toggleLyrics(); }}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Image
            source="sf:quote.bubble"
            style={{ width: 22, height: 22 }}
            tintColor="rgba(255,255,255,0.5)"
          />
        </Pressable>
      </View>
    </View>
  );
}
