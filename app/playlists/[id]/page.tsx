import AppLayout from "@/components/layout/AppLayout";
import { PlaylistDetailClient } from "./PlaylistDetailClient";

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlaylistDetailPage({
  params,
}: PlaylistDetailPageProps) {
  const { id } = await params;

  return (
    <AppLayout>
      <PlaylistDetailClient playlistId={id} />
    </AppLayout>
  );
}
