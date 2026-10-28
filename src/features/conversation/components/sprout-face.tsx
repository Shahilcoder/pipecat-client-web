import { cn } from "@/lib/utils"

import type { BotActivity } from "../types"

interface SproutFaceProps {
  activity?: BotActivity
  className?: string
}

// SVG parts scale around their own centre rather than the viewBox origin.
const OWN_CENTRE = "origin-center [transform-box:fill-box]"

/** Sprout's blob face, the bot's mark. Its expression follows what the bot is doing. Decorative. */
export function SproutFace({ activity = "idle", className }: SproutFaceProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <g className={cn(OWN_CENTRE, activity === "speaking" && "animate-blob-bob")}>
        <path d="M24 8c0-3.6 2.4-6 6.2-6.4C30 5.4 27.6 7.8 24 8Z" className="fill-zest" />
        <path
          d="M24 8c10.6 0 18 7.4 18 17.6C42 36 34.4 43 24 43S6 36 6 25.6C6 15.4 13.4 8 24 8Z"
          className="fill-primary"
        />
        <ellipse cx="15.5" cy="16" rx="4.2" ry="2.4" transform="rotate(-32 15.5 16)" className="fill-zest/80" />
        <g
          className={cn(
            "transition-transform duration-300",
            activity === "listening" && "-translate-y-[1.5px]"
          )}
        >
          <g className={cn(OWN_CENTRE, activity === "thinking" && "animate-blob-blink")}>
            <ellipse cx="18" cy="24" rx="2.4" ry="3.2" className="fill-foreground" />
            <ellipse cx="30" cy="24" rx="2.4" ry="3.2" className="fill-foreground" />
          </g>
        </g>
        <circle cx="12.5" cy="30" r="2.8" className="fill-sunny/90" />
        <circle cx="35.5" cy="30" r="2.8" className="fill-sunny/90" />
        <path
          d="M19.5 30.5q4.5 4.5 9 0"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          className={cn("stroke-foreground", OWN_CENTRE, activity === "speaking" && "animate-blob-talk")}
        />
      </g>
    </svg>
  )
}
