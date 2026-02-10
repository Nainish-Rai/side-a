import { useCallback, useRef, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View } from "@/src/tw";

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
}

const THUMB_SIZE = 12;
const HIT_HEIGHT = 32;
const TRACK_HEIGHT = 4;

export function ProgressBar({ position, duration, onSeek }: ProgressBarProps) {
  const progress = duration > 0 ? position / duration : 0;
  const [trackWidth, setTrackWidth] = useState(0);
  const widthRef = useRef(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setTrackWidth(w);
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
  const filledWidth = trackWidth * progress;
  const thumbLeft = Math.max(
    0,
    Math.min(filledWidth - THUMB_SIZE / 2, trackWidth - THUMB_SIZE)
  );

  return (
    <GestureDetector gesture={composed}>
      <View
        onLayout={onLayout}
        style={{ height: HIT_HEIGHT, justifyContent: "center" }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: TRACK_HEIGHT / 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: TRACK_HEIGHT,
              width: filledWidth,
              backgroundColor: "#fff",
              borderRadius: TRACK_HEIGHT / 2,
            }}
          />
        </View>
        {trackWidth > 0 && (
          <View
            style={{
              position: "absolute",
              left: thumbLeft,
              top: (HIT_HEIGHT - THUMB_SIZE) / 2,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#fff",
            }}
          />
        )}
      </View>
    </GestureDetector>
  );
}
