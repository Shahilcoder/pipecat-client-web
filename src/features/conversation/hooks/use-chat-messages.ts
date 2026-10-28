import { useMemo } from "react"
import { usePipecatConversation } from "@pipecat-ai/client-react"

import { toChatMessages } from "../lib/chat-messages"
import type { ChatMessage } from "../types"

// Only the text the TTS has spoken, so the reply grows in step with the audio. Module-level keeps
// the reference stable across renders.
const BOT_OUTPUT_FILTER = { unspoken: false }

/** The live transcript from usePipecatConversation, mapped with toChatMessages. */
export function useChatMessages(): ChatMessage[] {
  const { messages } = usePipecatConversation({ botOutputFilter: BOT_OUTPUT_FILTER })
  return useMemo(() => toChatMessages(messages), [messages])
}
