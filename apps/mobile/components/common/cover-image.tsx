import React from "react";
import { Image } from "expo-image";
import { api } from "@/lib/api";

interface CoverImageProps {
  coverId: string | number | undefined;
  size?: string;
  width: number;
  height: number;
  borderRadius?: number;
  className?: string;
}

export function CoverImage({ coverId, size = "640", width, height, borderRadius = 8 }: CoverImageProps) {
  const uri = api.getCoverUrl(coverId ?? "", size);

  return (
    <Image
      source={{ uri }}
      style={{ width, height, borderRadius }}
      contentFit="cover"
      transition={200}
      recyclingKey={String(coverId)}
    />
  );
}
