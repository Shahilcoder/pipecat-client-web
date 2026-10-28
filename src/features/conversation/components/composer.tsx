import { useState, type FormEvent, type KeyboardEvent } from "react"
import { ArrowUpIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import type { BotActivity, CallStatus } from "../types"
import { ActivityIndicator } from "./activity-indicator"
import { CallButton } from "./call-button"
import { MicToggleButton } from "./mic-toggle-button"

interface ComposerProps {
  callStatus: CallStatus
  botActivity: BotActivity
  isMicEnabled: boolean
  onStartCall: () => void
  onEndCall: () => void
  onToggleMic: () => void
  onSendText: (text: string) => void
}

const PLACEHOLDERS: Record<CallStatus, string> = {
  idle: "Start a call to chat",
  connecting: "Connecting…",
  ready: "Type a message, or just talk",
  ending: "Ending call…",
  error: "Start a new call to chat",
}

export function Composer({
  callStatus,
  botActivity,
  isMicEnabled,
  onStartCall,
  onEndCall,
  onToggleMic,
  onSendText,
}: ComposerProps) {
  const [draft, setDraft] = useState("")
  const isReady = callStatus === "ready"
  const trimmedDraft = draft.trim()
  const canSend = isReady && trimmedDraft.length > 0

  function submitDraft() {
    if (!canSend) return
    onSendText(trimmedDraft)
    setDraft("")
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submitDraft()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a newline, and IME composition (e.g. Japanese input) is left alone.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submitDraft()
    }
  }

  return (
    <div className="px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl rounded-[28px] border bg-surface shadow-lg shadow-primary/12 transition-colors focus-within:border-primary"
      >
        <label htmlFor="composer-input" className="sr-only">
          Message
        </label>
        {/* ponytail: field-sizing-content auto-grows natively; browsers without it scroll inside max-h. */}
        <Textarea
          id="composer-input"
          rows={1}
          value={draft}
          disabled={!isReady}
          placeholder={PLACEHOLDERS[callStatus]}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
          className="max-h-40 min-h-12 resize-none border-0 bg-transparent px-4 pt-3.5 text-base shadow-none focus-visible:ring-0 disabled:bg-transparent disabled:opacity-100 md:text-base dark:bg-transparent dark:disabled:bg-transparent"
        />

        <div className="flex items-center gap-1 px-2 pb-2">
          {isReady && <MicToggleButton isMicEnabled={isMicEnabled} onToggleMic={onToggleMic} />}

          <div className="min-w-0 flex-1 px-1">
            {isReady && <ActivityIndicator botActivity={botActivity} />}
          </div>

          {canSend && (
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              title="Send message"
              className="size-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/85"
            >
              <ArrowUpIcon className="size-5" />
            </Button>
          )}

          <CallButton callStatus={callStatus} onStartCall={onStartCall} onEndCall={onEndCall} />
        </div>
      </form>
    </div>
  )
}
