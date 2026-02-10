import "@/src/global.css";

import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { View, Modal } from "react-native";
import { usePlayerStore } from "@/stores/player-store";
import { MiniPlayer } from "@/components/mini-player";
import { FullscreenPlayer } from "@/components/fullscreen-player";

function TabIcon({ sfSymbol, focused }: { sfSymbol: string; focused: boolean }) {
  return (
    <Image
      source={`sf:${sfSymbol}`}
      style={{ width: 22, height: 22 }}
      tintColor={focused ? "#fff" : "#666"}
    />
  );
}

export default function RootLayout() {
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const setupPlayer = usePlayerStore((s) => s.setupPlayer);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    setupPlayer();
  }, [setupPlayer]);

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#666",
          tabBarStyle: {
            backgroundColor: "#000",
            borderTopColor: "rgba(255,255,255,0.1)",
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <TabIcon sfSymbol="house.fill" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="(search)"
          options={{
            title: "Search",
            tabBarIcon: ({ focused }) => (
              <TabIcon sfSymbol="magnifyingglass" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="(library)"
          options={{
            title: "Library",
            tabBarIcon: ({ focused }) => (
              <TabIcon sfSymbol="books.vertical.fill" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            title: "Settings",
            tabBarIcon: ({ focused }) => (
              <TabIcon sfSymbol="gearshape.fill" focused={focused} />
            ),
          }}
        />
      </Tabs>

      {currentTrack && (
        <MiniPlayer onExpand={() => setFullscreenVisible(true)} />
      )}

      <Modal
        visible={fullscreenVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
      >
        <FullscreenPlayer onCollapse={() => setFullscreenVisible(false)} />
      </Modal>
    </View>
  );
}
