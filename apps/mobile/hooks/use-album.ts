import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAlbum(albumId: number) {
  return useQuery({
    queryKey: ["album", albumId],
    queryFn: () => api.getAlbum(albumId),
    enabled: !!albumId && !isNaN(albumId),
    staleTime: 1000 * 60 * 10,
  });
}
