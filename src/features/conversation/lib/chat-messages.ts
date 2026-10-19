import type { 
  BotOutputText,
  ConversationMessage,
  ConversationMessagePart,
} from "@pipecat-ai/client-react"

import type { ChatMessage, ChatRole } from "../types"

function isChatRole(role: ConversationMessage["role"]): role is ChatRole {
  return role === "user" || role === "assistant"
}

function isBotOutputText(text: unknown): text is BotOutputText {
  return typeof text === "object" && text !== null && "spoken" in text && "unspoken" in text
}

/**
 * Bot output parts already carry their separator (the hook prepends it to `spoken`), so they join
 * as-is. Plain string parts (user transcript segments) are separate utterances and get a space.
 */
function getPartText({ text }: ConversationMessagePart): string {
  if (isBotOutputText(text)) return text.spoken + text.unspoken
  if (typeof text === "string") return ` ${text}`

  return ""
}

function getMessageText(message: ConversationMessage): string {
  return message.parts.map(getPartText).join("").trim()
}

/** Flattens Pipecat's transcript into display messages: user and assistant only, text parts joined. */
export function toChatMessages(messages: ConversationMessage[]): ChatMessage[] {
  return messages.flatMap((message) => {
    const { role } = message
    if (!isChatRole(role)) return []

    const text = getMessageText(message)
    if (!text) return []

    return [
      {
        // createdAt never changes while a message streams, so React keeps the same element.
        id: `${role}-${message.createdAt}`,
        role,
        text,
        isFinal: message.final !== false,
      },
    ]
  })
}
