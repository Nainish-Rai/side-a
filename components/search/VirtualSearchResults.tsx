"use client";

import { FixedSizeList as List } from "react-window";
import AlbumCard from "./AlbumCard";
import type { Album } from "@/lib/api/types";

interface VirtualSearchResultsProps {
  albums: Album[];
  height: number;
  width: number;
}

export function VirtualSearchResults({ albums, height, width }: VirtualSearchResultsProps) {
  const itemsPerRow = Math.floor(width / 200); // 200px per card
  const rowCount = Math.ceil(albums.length / itemsPerRow);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIndex = index * itemsPerRow;
    const rowAlbums = albums.slice(startIndex, startIndex + itemsPerRow);

    return (
      <div style={style} className="flex gap-4 px-4">
        {rowAlbums.map((album) => (
          <div key={album.id} className="w-[180px]">
            <AlbumCard album={album} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <List
      height={height}
      itemCount={rowCount}
      itemSize={280}
      width={width}
      overscanCount={2}
    >
      {Row}
    </List>
  );
}
