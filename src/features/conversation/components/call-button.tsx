import { Loader2Icon, PhoneIcon, PhoneOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { CallStatus } from "../types"

interface CallButtonProps {
  callStatus: CallStatus
  onStartCall: () => void
  onEndCall: () => void
}

const LABELS: Record<CallStatus, string> = {
  idle: "Start call",
  connecting: "Connecting",
  ready: "End call",
  ending: "Ending call",
  error: "Start call",
}

export function CallButton({ callStatus, onStartCall, onEndCall }: CallButtonProps) {
  const isBusy = callStatus === "connecting" || callStatus === "ending"
  const isInCall = callStatus === "ready"

  const label = LABELS[callStatus]

  return (
    <Button
      type="button"
      size="icon"
      aria-label={label}
      title={label}
      disabled={isBusy}
      onClick={isInCall ? onEndCall : onStartCall}
      className={cn(
        "size-11 rounded-full",
        isInCall
          ? "bg-destructive text-white hover:bg-destructive/85"
          : "bg-primary text-primary-foreground hover:bg-primary/85"
      )}
    >
      {isBusy ? (
        <Loader2Icon className="size-5 animate-spin" />
      ) : isInCall ? (
        <PhoneOffIcon className="size-5" />
      ) : (
        <PhoneIcon className="size-5" />
      )}
    </Button>
  )
}
