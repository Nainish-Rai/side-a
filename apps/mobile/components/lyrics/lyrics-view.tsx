import React, { useRef, useEffect } from "react";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { View, Text } from "@/src/tw";

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsViewProps {
  lines: LyricLine[];
  currentLineIndex: number;
}

export function LyricsView({ lines, currentLineIndex }: LyricsViewProps) {
  const listRef = useRef<FlashListRef<LyricLine>>(null);

  useEffect(() => {
    if (currentLineIndex >= 0 && listRef.current) {
      listRef.current.scrollToIndex({
        index: currentLineIndex,
        animated: true,
        viewPosition: 0.4,
      });
    }
  }, [currentLineIndex]);

  return (
    <FlashList
      ref={listRef}
      data={lines}
      renderItem={({ item, index }) => (
        <View className="px-6 py-2">
          <Text
            className={`text-2xl font-semibold leading-tight ${
              index === currentLineIndex
                ? "text-sf-text"
                : index < currentLineIndex
                  ? "text-sf-text/30"
                  : "text-sf-text/40"
            }`}
          >
            {item.text || "..."}
          </Text>
        </View>
      )}
      keyExtractor={(_, index) => String(index)}
    />
  );
}
