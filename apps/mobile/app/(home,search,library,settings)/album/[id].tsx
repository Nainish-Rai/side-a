import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        <Text style={{ fontSize: 16, opacity: 0.6 }}>Album {id}</Text>
      </View>
    </ScrollView>
  );
}
