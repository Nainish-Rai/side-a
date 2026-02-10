import { ScrollView, Text } from "react-native";

export default function LibraryScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text style={{ color: "#fff", fontSize: 16 }}>Library</Text>
    </ScrollView>
  );
}
