import { View, Text, ScrollView } from "react-native";

export default function SettingsScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        <Text style={{ fontSize: 16, opacity: 0.6 }}>Settings</Text>
      </View>
    </ScrollView>
  );
}
