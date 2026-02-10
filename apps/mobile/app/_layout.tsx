import "@/src/global.css";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioProvider } from "@/contexts/audio-context";
import { LibraryProvider } from "@/contexts/library-context";
import { MiniPlayer } from "@/components/player/mini-player";
import { LibraryTracker } from "@/components/library-tracker";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View } from "@/src/tw";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const queryClient = new QueryClient();
const TAB_BAR_HEIGHT = 49;

function MiniPlayerOverlay() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        position: "absolute",
        bottom: TAB_BAR_HEIGHT + insets.bottom,
        left: 0,
        right: 0,
      }}
    >
      <MiniPlayer />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AudioProvider>
          <LibraryProvider>
            <View className="flex-1">
              <NativeTabs>
                <NativeTabs.Trigger name="(home)">
                  <Icon sf="house" />
                  <Label>Home</Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="(search)" role="search" />
                <NativeTabs.Trigger name="(library)">
                  <Icon sf="square.stack" />
                  <Label>Library</Label>
                </NativeTabs.Trigger>
                <NativeTabs.Trigger name="(settings)">
                  <Icon sf="gearshape" />
                  <Label>Settings</Label>
                </NativeTabs.Trigger>
              </NativeTabs>
              <MiniPlayerOverlay />
              <LibraryTracker />
            </View>
          </LibraryProvider>
        </AudioProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
