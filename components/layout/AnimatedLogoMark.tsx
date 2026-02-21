"use client"

import { Matrix, type Frame } from "@/components/ui/matrix"

const logoFrames: Frame[] = [
  [
    [1, 0.15, 0.85],
    [0.2, 0.55, 0.2],
    [0.9, 0.15, 1],
  ],
  [
    [0.85, 0.25, 1],
    [0.25, 0.7, 0.25],
    [1, 0.25, 0.85],
  ],
  [
    [0.65, 0.35, 0.95],
    [0.35, 0.85, 0.35],
    [0.95, 0.35, 0.65],
  ],
  [
    [0.8, 0.2, 1],
    [0.2, 0.75, 0.2],
    [1, 0.2, 0.8],
  ],
]

interface AnimatedLogoMarkProps {
  size?: number
  gap?: number
  className?: string
}

export function AnimatedLogoMark({
  size = 3,
  gap = 1,
  className,
}: AnimatedLogoMarkProps) {
  return (
    <Matrix
      rows={3}
      cols={3}
      frames={logoFrames}
      fps={8}
      loop
      size={size}
      gap={gap}
      className={className}
      ariaLabel="Animated SIDE A logo mark"
    />
  )
}
