import { cn } from "@/lib/utils"

interface SparkMarkProps {
  isAnimated?: boolean
  className?: string
}

const RAY_ANGLES = [0, 45, 90, 135]

/** Generic eight-ray spark used as the assistant's mark. Decorative, so hidden from screen readers. */
export function SparkMark({ isAnimated = false, className }: SparkMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6 text-primary", isAnimated && "animate-spark", className)}
    >
      {RAY_ANGLES.map((angle) => (
        <line
          key={angle}
          x1="12"
          y1="2.5"
          x2="12"
          y2="21.5"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </svg>
  )
}
