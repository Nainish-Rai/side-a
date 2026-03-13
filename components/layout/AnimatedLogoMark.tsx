"use client";

interface AnimatedLogoMarkProps {
  size?: number;
  gap?: number;
  className?: string;
}

export function AnimatedLogoMark({
  size = 3,
  gap = 1,
  className,
}: AnimatedLogoMarkProps) {
  return (
    <div
      className={className}
      aria-label="SIDE A logo mark"
      role="img"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(3, ${size}px)`,
        gridTemplateRows: `repeat(3, ${size}px)`,
        gap: `${gap}px`,
      }}
    >
      <span className="block bg-[var(--vhs-pink)]" />
      <span className="block bg-transparent" />
      <span className="block bg-[var(--vhs-blue)]" />
      <span className="block bg-transparent" />
      <span className="block bg-[var(--vhs-teal)]" />
      <span className="block bg-transparent" />
      <span className="block bg-[var(--vhs-blue)]" />
      <span className="block bg-transparent" />
      <span className="block bg-[var(--vhs-pink)]" />
    </div>
  );
}
