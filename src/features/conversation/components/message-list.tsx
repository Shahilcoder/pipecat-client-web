import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

import type { BotActivity, ChatMessage } from "../types"
import { MessageItem } from "./message-item"
import { SproutFace } from "./sprout-face"

interface MessageListProps {
  messages: ChatMessage[]
  botActivity: BotActivity
}

export function MessageList({ messages, botActivity }: MessageListProps) {
  const listEndRef = useRef<HTMLDivElement>(null)
  const isBotBusy = botActivity === "thinking" || botActivity === "speaking"

  useEffect(() => {
    // Optional call: jsdom has no scrollIntoView, so tests don't need to stub it.
    listEndRef.current?.scrollIntoView?.({ block: "end", behavior: "smooth" })
  }, [messages, botActivity])

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain">
      <div
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-4 pb-6"
      >
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        <SproutFace
          activity={botActivity}
          // Pulls the face up out of the list's 24px message gap so it sits under the last reply.
          className={cn("-mt-6", isBotBusy ? "opacity-100" : "opacity-70")}
        />
        <div ref={listEndRef} />
      </div>
    </div>
  )
}
