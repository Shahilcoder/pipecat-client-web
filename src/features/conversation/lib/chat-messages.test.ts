import type { ConversationMessage, ConversationMessagePart } from "@pipecat-ai/client-react"
import { describe, expect, it } from "vitest"

import { toChatMessages } from "./chat-messages"

const CREATED_AT = "2026-10-17T10:00:00.000Z"

function buildPart(text: ConversationMessagePart["text"]): ConversationMessagePart {
  return { text, final: true, createdAt: CREATED_AT }
}

function buildMessage(overrides: Partial<ConversationMessage>): ConversationMessage {
  return { role: "assistant", final: true, createdAt: CREATED_AT, parts: [], ...overrides }
}

describe("toChatMessages", () => {
  it("returns an empty list for an empty transcript", () => {
    expect(toChatMessages([])).toEqual([])
  })

  it("keeps user and assistant messages and drops system and function_call ones", () => {
    const messages = [
      buildMessage({ role: "system", parts: [buildPart("You are helpful")] }),
      buildMessage({ role: "user", parts: [buildPart("Hi")] }),
      buildMessage({ role: "function_call", parts: [buildPart("get_current_time")] }),
      buildMessage({ role: "assistant", parts: [buildPart({ spoken: "Hello!", unspoken: "" })] }),
    ]

    expect(toChatMessages(messages).map((message) => message.role)).toEqual(["user", "assistant"])
  })

  it("joins user transcript segments with a space", () => {
    const [message] = toChatMessages([
      buildMessage({ role: "user", parts: [buildPart("What time"), buildPart("is it?")] }),
    ])

    expect(message.text).toBe("What time is it?")
  })

  it("shows spoken and not-yet-spoken bot output together", () => {
    const [message] = toChatMessages([
      buildMessage({ parts: [buildPart({ spoken: "It's four ", unspoken: "in London." })] }),
    ])

    expect(message.text).toBe("It's four in London.")
  })

  it("joins bot output parts as-is because Pipecat already adds the separator", () => {
    const [message] = toChatMessages([
      buildMessage({
        parts: [
          buildPart({ spoken: "Hello.", unspoken: "" }),
          buildPart({ spoken: " How are you?", unspoken: "" }),
        ],
      }),
    ])

    expect(message.text).toBe("Hello. How are you?")
  })

  it("treats a message without a final flag as final", () => {
    const [injected, streaming] = toChatMessages([
      buildMessage({ final: undefined, parts: [buildPart("Injected")] }),
      buildMessage({ role: "user", final: false, parts: [buildPart("Still talk")] }),
    ])

    expect(injected.isFinal).toBe(true)
    expect(streaming.isFinal).toBe(false)
  })

  it("keeps the same id while a message streams in", () => {
    const partial = buildMessage({ parts: [buildPart({ spoken: "", unspoken: "Hel" })] })
    const complete = buildMessage({ parts: [buildPart({ spoken: "Hello", unspoken: "" })] })

    expect(toChatMessages([partial])[0].id).toBe(toChatMessages([complete])[0].id)
  })

  it("drops messages with no text", () => {
    const messages = [
      buildMessage({ role: "user", parts: [] }),
      buildMessage({ parts: [buildPart({ spoken: "  ", unspoken: "" })] }),
    ]

    expect(toChatMessages(messages)).toEqual([])
  })
})
