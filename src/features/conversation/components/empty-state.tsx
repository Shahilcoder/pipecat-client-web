import type { CallStatus } from "../types"
import { SparkMark } from "./spark-mark"

interface EmptyStateProps {
  callStatus: CallStatus
}

const HINTS: Record<CallStatus, string> = {
  idle: "Tap the call button to start talking.",
  connecting: "Connecting to your assistant…",
  ready: "Say hello, or type a message below.",
  ending: "Ending the call…",
  error: "Something went wrong. Tap the call button to try again.",
}

export function EmptyState({ callStatus }: EmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <SparkMark isAnimated={callStatus === "connecting"} className="size-10" />
      <h2 className="font-serif text-3xl font-normal tracking-tight text-balance">
        How can I help you today?
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">{HINTS[callStatus]}</p>
    </section>
  )
}
