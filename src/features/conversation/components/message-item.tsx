import { useState } from "react"

import { cn } from "@/lib/utils"

import type { ChatMessage } from "../types"

interface MessageItemProps {
  message: ChatMessage
}

/** Delay between tokens that arrive together. Tokens alternate word and space, so ~40ms per word. */
const STAGGER_MS = 20

function Word({ word, delayMs }: { word: string; delayMs: number }) {
  // Frozen at mount, so a re-render never shifts an animation that is already running.
  const [delay] = useState(delayMs)
  return (
    <span
      className="inline-block animate-word-pop"
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {word}
    </span>
  )
}

/** Each word pops in as the spoken text grows. Index keys keep mounted words, so only new ones animate. */
function PoppingWords({ text }: { text: string }) {
  const tokens = text.split(/(\s+)/)
  // Tokens that were already on screen before this update; only the ones after them get staggered.
  const [count, setCount] = useState(0)
  const [firstNewIndex, setFirstNewIndex] = useState(0)
  if (tokens.length !== count) {
    setFirstNewIndex(count)
    setCount(tokens.length)
  }

  return tokens.map((token, index) =>
    token.trim() === "" ? (
      token
    ) : (
      <Word
        key={index}
        word={token}
        delayMs={Math.max(0, index - firstNewIndex) * STAGGER_MS}
      />
    )
  )
}

export function MessageItem({ message }: MessageItemProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p
          className={cn(
            "max-w-[85%] rounded-3xl rounded-br-lg bg-user-bubble px-4 py-2.5 text-[15px] leading-6 text-user-bubble-foreground break-words whitespace-pre-wrap",
            !message.isFinal && "text-user-bubble-foreground/75"
          )}
        >
          <span className="sr-only">You: </span>
          {message.text}
        </p>
      </div>
    )
  }

  return (
    <p className="text-[17px] leading-7 break-words whitespace-pre-wrap">
      <span className="sr-only">Assistant: </span>
      <PoppingWords text={message.text} />
    </p>
  )
}
