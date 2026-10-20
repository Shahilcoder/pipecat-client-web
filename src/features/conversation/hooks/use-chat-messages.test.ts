import type { ConversationMessage } from "@pipecat-ai/client-react"
import { usePipecatConversation } from "@pipecat-ai/client-react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useChatMessages } from "./use-chat-messages"

vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  usePipecatConversation: vi.fn(),
}))

const messages: ConversationMessage[] = [
  {
    role: "user",
    final: true,
    createdAt: "2026-10-17T10:00:00.000Z",
    parts: [{ text: "Hi", final: true, createdAt: "2026-10-17T10:00:00.000Z" }],
  },
]

function mockConversation(conversationMessages: ConversationMessage[]) {
  vi.mocked(usePipecatConversation).mockReturnValue({
    messages: conversationMessages,
    injectMessage: vi.fn(),
    botOutputEvents: new Map(),
  })
}

describe("useChatMessages", () => {
  it("returns the Pipecat transcript as chat messages", () => {
    mockConversation(messages)

    const { result } = renderHook(() => useChatMessages())

    expect(result.current).toEqual([
      { id: "user-2026-10-17T10:00:00.000Z", role: "user", text: "Hi", isFinal: true },
    ])
  })

  it("asks for spoken bot text only, so the transcript follows the TTS", () => {
    mockConversation(messages)

    renderHook(() => useChatMessages())

    expect(usePipecatConversation).toHaveBeenCalledWith({ botOutputFilter: { unspoken: false } })
  })

  it("keeps the same array while the transcript is unchanged", () => {
    mockConversation(messages)

    const { result, rerender } = renderHook(() => useChatMessages())
    const firstResult = result.current
    rerender()

    expect(result.current).toBe(firstResult)
  })
})
