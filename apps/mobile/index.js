import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { Platform } from "react-native";

export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);

if (Platform.OS !== "web") {
  const TrackPlayer = require("react-native-track-player").default;
  const playbackService = require("./services/playback-service").default;
  TrackPlayer.registerPlaybackService(() => playbackService);
}
