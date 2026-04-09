import { musicApi } from "@/lib/api";
import type { Track } from "@/lib/api/types";
import type { PlayableTrackSearch } from "@/lib/ytmusic-import/types";

const SEARCH_RESULT_LIMIT = 15;

export class TidalPlayableTrackSearch implements PlayableTrackSearch {
  async searchPlayableTracks(query: string): Promise<Track[]> {
    const response = await musicApi.searchTracks(query, {
      offset: 0,
      limit: SEARCH_RESULT_LIMIT,
      provider: "tidal",
    });

    return response.items;
  }
}
