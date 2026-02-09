import { View, Text, ScrollView } from "react-native";

export default function SearchScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        <Text style={{ fontSize: 16, opacity: 0.6 }}>Search for music</Text>
      </View>
    </ScrollView>
  );
}
