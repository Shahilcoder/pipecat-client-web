import { cn } from "@/lib/utils"

import type { ChatMessage } from "../types"

interface MessageItemProps {
  message: ChatMessage
}

export function MessageItem({ message }: MessageItemProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p
          className={cn(
            "max-w-[85%] rounded-2xl bg-user-bubble px-4 py-2.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap",
            !message.isFinal && "text-muted-foreground"
          )}
        >
          <span className="sr-only">You: </span>
          {message.text}
        </p>
      </div>
    )
  }

  return (
    <p className="font-serif text-[17px] leading-7 break-words whitespace-pre-wrap">
      <span className="sr-only">Assistant: </span>
      {message.text}
    </p>
  )
}
