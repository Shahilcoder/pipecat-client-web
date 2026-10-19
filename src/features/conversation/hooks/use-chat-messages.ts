import { useMemo } from "react"
import { usePipecatConversation } from "@pipecat-ai/client-react"

import { toChatMessages } from "../lib/chat-messages"
import type { ChatMessage } from "../types"

/** The live transcript from usePipecatConversation, mapped with toChatMessages. */
export function useChatMessages(): ChatMessage[] {
  const { messages } = usePipecatConversation()
  return useMemo(() => toChatMessages(messages), [messages])
}
