import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router/stack";
import { View, Text, ScrollView } from "@/src/tw";

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Album" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1 bg-black"
        contentContainerClassName="p-4 gap-4"
      >
        <Text className="text-white text-base">Album {id}</Text>
      </ScrollView>
    </>
  );
}
