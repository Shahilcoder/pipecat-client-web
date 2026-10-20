import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Toaster } from "@/components/ui/sonner"

import { useBotActivity } from "../hooks/use-bot-activity"
import { useChatMessages } from "../hooks/use-chat-messages"
import { useVoiceSession, type VoiceSession } from "../hooks/use-voice-session"
import type { ChatMessage } from "../types"
import { ConversationScreen, SEND_TEXT_ERROR_MESSAGE } from "./conversation-screen"

// No factory: Vitest replaces every export with a vi.fn().
vi.mock("../hooks/use-voice-session")
vi.mock("../hooks/use-bot-activity")
vi.mock("../hooks/use-chat-messages")

const messages: ChatMessage[] = [{ id: "1", role: "user", text: "Hi there", isFinal: true }]

function mockVoiceSession(overrides: Partial<VoiceSession> = {}): VoiceSession {
  const voiceSession: VoiceSession = {
    callStatus: "idle",
    isMicEnabled: true,
    errorMessage: undefined,
    startCall: vi.fn().mockResolvedValue(undefined),
    endCall: vi.fn().mockResolvedValue(undefined),
    toggleMic: vi.fn(),
    sendText: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  vi.mocked(useVoiceSession).mockReturnValue(voiceSession)
  return voiceSession
}

beforeEach(() => {
  vi.mocked(useBotActivity).mockReturnValue("idle")
  vi.mocked(useChatMessages).mockReturnValue(messages)
})

describe("ConversationScreen", () => {
  it("starts a call from the call button", async () => {
    const { startCall } = mockVoiceSession()
    render(<ConversationScreen />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Start call" }))

    expect(startCall).toHaveBeenCalledOnce()
  })

  it("hides the old transcript when a new conversation starts", async () => {
    mockVoiceSession()
    render(<ConversationScreen />)

    await userEvent.setup().click(screen.getByRole("button", { name: "New conversation" }))

    expect(screen.queryByText("Hi there")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Hi, I'm Sprout. What's on your mind?" })).toBeInTheDocument()
  })

  it("shows the session error as an alert", () => {
    mockVoiceSession({ callStatus: "error", errorMessage: "Server busy" })
    render(<ConversationScreen />)

    expect(screen.getByRole("alert")).toHaveTextContent("Server busy")
  })

  it("shows a toast when typed text cannot be sent", async () => {
    mockVoiceSession({
      callStatus: "ready",
      sendText: vi.fn().mockRejectedValue(new Error("Data channel closed")),
    })
    render(
      <>
        <ConversationScreen />
        <Toaster />
      </>
    )

    await userEvent.setup().type(screen.getByRole("textbox", { name: "Message" }), "hi{Enter}")

    expect(await screen.findByText(SEND_TEXT_ERROR_MESSAGE)).toBeInTheDocument()
  })
})
