import { Stack } from "expo-router/stack";

const TITLES: Record<string, string> = {
  home: "Side A",
  search: "Search",
  library: "Library",
  settings: "Settings",
};

export default function SharedLayout({
  segment,
}: {
  segment: string;
}) {
  const screen = segment.match(/\((.*)\)/)?.[1] ?? "home";

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: "transparent" },
        headerLargeTitle: true,
        headerBlurEffect: "none",
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name={screen} options={{ title: TITLES[screen] }} />
      <Stack.Screen name="album/[id]" options={{ headerLargeTitle: false }} />
      <Stack.Screen name="player" options={{ presentation: "modal" }} />
    </Stack>
  );
}
