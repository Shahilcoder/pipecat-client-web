import type { BotActivity, CallStatus } from "../types"
import { SproutFace } from "./sprout-face"

interface EmptyStateProps {
  callStatus: CallStatus
}

const HINTS: Record<CallStatus, string> = {
  idle: "Tap the green call button and let's chat!",
  connecting: "Waking up… one second!",
  ready: "I'm all ears. Say hello, or type below.",
  ending: "Bye for now! Wrapping up…",
  error: "Oops, I lost you there. Tap the call button to try again.",
}

const FACES: Partial<Record<CallStatus, BotActivity>> = {
  connecting: "thinking",
  ready: "listening",
}

export function EmptyState({ callStatus }: EmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <SproutFace activity={FACES[callStatus]} className="size-24" />
      <h2 className="font-display text-3xl font-semibold text-balance">
        Hi, I'm Sprout. What's on your mind?
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">{HINTS[callStatus]}</p>
    </section>
  )
}
