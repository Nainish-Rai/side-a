import { useState, useCallback } from "react";
import { View, Text } from "@/src/tw";
import { usePlayerStore } from "@/stores/player-store";
import { useProgress } from "react-native-track-player";
import { formatTime } from "@side-a/shared";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withTiming,
} from "react-native-reanimated";

export function SeekBar() {
  const { position, duration } = useProgress(200);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const [barWidth, setBarWidth] = useState(0);
  const isSeeking = useSharedValue(false);
  const seekProgress = useSharedValue(0);

  const onLayout = useCallback(
    (e: { nativeEvent: { layout: { width: number } } }) => {
      setBarWidth(e.nativeEvent.layout.width);
    },
    []
  );

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const currentProgress =
    duration > 0 ? clamp(position / duration, 0, 1) : 0;

  const handleSeekEnd = useCallback(
    (fraction: number) => {
      if (duration > 0) {
        seekTo(fraction * duration);
      }
    },
    [duration, seekTo]
  );

  const panGesture = Gesture.Pan()
    .onStart((e) => {
      isSeeking.value = true;
      if (barWidth > 0) {
        seekProgress.value = clamp(e.x / barWidth, 0, 1);
      }
    })
    .onUpdate((e) => {
      if (barWidth > 0) {
        seekProgress.value = clamp(e.x / barWidth, 0, 1);
      }
    })
    .onEnd(() => {
      runOnJS(handleSeekEnd)(seekProgress.value);
      isSeeking.value = false;
    });

  const tapGesture = Gesture.Tap().onEnd((e) => {
    if (barWidth > 0) {
      const fraction = clamp(e.x / barWidth, 0, 1);
      seekProgress.value = fraction;
      runOnJS(handleSeekEnd)(fraction);
    }
  });

  const gesture = Gesture.Race(panGesture, tapGesture);

  const fillStyle = useAnimatedStyle(() => {
    const progress = isSeeking.value ? seekProgress.value : currentProgress;
    return {
      width: `${progress * 100}%`,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const progress = isSeeking.value ? seekProgress.value : currentProgress;
    return {
      left: `${progress * 100}%`,
      transform: [{ translateX: -8 }, { translateY: -6.5 }],
    };
  });

  const remaining = duration - position;
  const displayPosition = isSeeking.value
    ? seekProgress.value * duration
    : position;

  return (
    <View className="px-6">
      <GestureDetector gesture={gesture}>
        <Animated.View onLayout={onLayout} style={{ position: "relative" }}>
          <View className="h-[3px] bg-white/20 rounded-full my-2">
            <Animated.View
              style={[
                fillStyle,
                {
                  height: "100%",
                  borderRadius: 9999,
                  backgroundColor: "white",
                },
              ]}
            />
            <Animated.View
              style={[
                thumbStyle,
                {
                  position: "absolute",
                  top: 0,
                  width: 16,
                  height: 16,
                  borderRadius: 9999,
                  backgroundColor: "white",
                },
              ]}
            />
          </View>
        </Animated.View>
      </GestureDetector>

      <View className="flex-row justify-between">
        <Text className="text-white/50 text-xs font-mono tabular-nums">
          {formatTime(position)}
        </Text>
        <Text className="text-white/50 text-xs font-mono tabular-nums">
          -{formatTime(remaining > 0 ? remaining : 0)}
        </Text>
      </View>
    </View>
  );
}
