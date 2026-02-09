import { Alert } from "react-native";
import { View, Text, Pressable, ScrollView } from "@/src/tw";
import { api } from "@/lib/api";
import Constants from "expo-constants";

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between px-4 py-3.5 bg-sf-bg-2"
    >
      <Text className="text-[15px] text-sf-text">{label}</Text>
      {value && <Text className="text-[15px] text-sf-text-2">{value}</Text>}
    </Pressable>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-px">
      <Text className="text-[11px] uppercase tracking-widest text-sf-text-2 px-4 pb-2 pt-6">
        {title}
      </Text>
      <View className="rounded-xl overflow-hidden">{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const handleClearCache = async () => {
    Alert.alert("Clear Cache", "This will clear all cached API data.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await api.clearCache();
          Alert.alert("Done", "Cache cleared.");
        },
      },
    ]);
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <SettingsSection title="Playback">
        <SettingsRow label="Audio Quality" value="Lossless" />
      </SettingsSection>

      <SettingsSection title="Storage">
        <SettingsRow label="Clear Cache" onPress={handleClearCache} />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow label="Version" value={version} />
        <SettingsRow label="Build" value="Expo" />
      </SettingsSection>
    </ScrollView>
  );
}
