import { View, Text, ScrollView } from "@/src/tw";

export default function SettingsScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-black"
      contentContainerClassName="p-4 gap-4"
    >
      <Text className="text-white text-base">Settings</Text>
    </ScrollView>
  );
}
