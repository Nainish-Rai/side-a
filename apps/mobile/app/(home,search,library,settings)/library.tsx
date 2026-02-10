import { View, Text, ScrollView } from "@/src/tw";

export default function LibraryScreen() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-black"
      contentContainerClassName="p-4 gap-4"
    >
      <Text className="text-white text-base">Library</Text>
    </ScrollView>
  );
}
