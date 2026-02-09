import React, { useCallback } from "react";
import { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View } from "@/src/tw";

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
}

export function ProgressBar({ position, duration, onSeek }: ProgressBarProps) {
  const progress = duration > 0 ? position / duration : 0;
  const widthRef = React.useRef(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
  }, []);

  const tapGesture = Gesture.Tap().onEnd((e) => {
    if (widthRef.current > 0 && duration > 0) {
      const ratio = Math.max(0, Math.min(1, e.x / widthRef.current));
      onSeek(ratio * duration);
    }
  });

  const panGesture = Gesture.Pan().onUpdate((e) => {
    if (widthRef.current > 0 && duration > 0) {
      const ratio = Math.max(0, Math.min(1, e.x / widthRef.current));
      onSeek(ratio * duration);
    }
  });

  const composed = Gesture.Race(tapGesture, panGesture);

  return (
    <GestureDetector gesture={composed}>
      <View onLayout={onLayout} className="h-8 justify-center">
        <View className="h-1 bg-sf-text/10 rounded-full overflow-hidden">
          <View
            className="h-full bg-sf-text rounded-full"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>
    </GestureDetector>
  );
}
