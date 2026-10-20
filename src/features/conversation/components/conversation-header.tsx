import { SquarePenIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { CallStatus } from "../types"
import { SproutFace } from "./sprout-face"

interface ConversationHeaderProps {
  callStatus: CallStatus
  canStartNewConversation: boolean
  onNewConversation: () => void
}

const STATUS_LABELS: Record<CallStatus, string> = {
  idle: "Offline",
  connecting: "Connecting",
  ready: "Live",
  ending: "Ending",
  error: "Disconnected",
}

const STATUS_DOT_CLASSES: Record<CallStatus, string> = {
  idle: "bg-muted-foreground/60",
  connecting: "bg-primary animate-pulse",
  ready: "bg-sunny ring-1 ring-primary/60 animate-pulse",
  ending: "bg-muted-foreground animate-pulse",
  error: "bg-destructive",
}

export function ConversationHeader({
  callStatus,
  canStartNewConversation,
  onNewConversation,
}: ConversationHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="New conversation"
          title="New conversation"
          disabled={!canStartNewConversation}
          onClick={onNewConversation}
        >
          <SquarePenIcon className="size-5" />
        </Button>

        <div className="flex flex-col items-center leading-tight">
          <h1 className="flex items-center gap-1.5 font-display text-lg font-semibold">
            <SproutFace className="size-6" />
            Sprout
          </h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASSES[callStatus])} />
            {STATUS_LABELS[callStatus]}
          </p>
        </div>

        {/* Mirrors the left button's width so the title stays centred. */}
        <div className="size-11" aria-hidden="true" />
      </div>
    </header>
  )
}
