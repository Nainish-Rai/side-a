import "@/src/global.css";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <Icon sf="house" />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(search)" role="search" />
        <NativeTabs.Trigger name="(library)">
          <Icon sf="square.stack" />
          <Label>Library</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="(settings)">
          <Icon sf="gearshape" />
          <Label>Settings</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </QueryClientProvider>
  );
}
