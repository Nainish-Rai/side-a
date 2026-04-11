import { Suspense } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { HomeContent } from "./HomeContent";

export default function Home() {
  return (
    <AppLayout>
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
    </AppLayout>
  );
}
