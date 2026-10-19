import { cn } from "@/lib/utils"

import type { BotActivity } from "../types"

interface ActivityIndicatorProps {
  botActivity: BotActivity
}

const ACTIVITY_LABELS: Record<BotActivity, string> = {
  idle: "",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
}

/** Three bars that pulse faster as the bot gets busier. */
export function ActivityIndicator({ botActivity }: ActivityIndicatorProps) {
  const label = ACTIVITY_LABELS[botActivity]

  return (
    <div aria-live="polite" className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
      {label && (
        <>
          <span aria-hidden="true" className="flex h-4 items-center gap-0.5">
            {[0, 150, 300].map((delayMs) => (
              <span
                key={delayMs}
                style={{ animationDelay: `${delayMs}ms` }}
                className={cn(
                  "w-0.5 rounded-full bg-current",
                  botActivity === "speaking" && "h-4 animate-pulse bg-primary",
                  botActivity === "thinking" && "h-2.5 animate-pulse",
                  botActivity === "listening" && "h-1.5"
                )}
              />
            ))}
          </span>
          <span className="truncate">{label}</span>
        </>
      )}
    </div>
  )
}
