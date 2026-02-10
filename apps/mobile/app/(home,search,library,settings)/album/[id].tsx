import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router/stack";
import { ScrollView, Text } from "react-native";

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: "Album" }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ flex: 1, backgroundColor: "#000" }}
        contentContainerStyle={{ padding: 16, gap: 16 }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>Album {id}</Text>
      </ScrollView>
    </>
  );
}
