import type { PipecatClient } from "@pipecat-ai/client-js"
import {
  useConversationContext,
  usePipecatClient,
  usePipecatClientMicControl,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createSession, SessionApiError } from "../api/session-api"
import type { SessionResponse } from "../types"
import { useVoiceSession } from "./use-voice-session"

vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  usePipecatClient: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
  usePipecatClientMicControl: vi.fn(),
  useConversationContext: vi.fn(),
}))

// Keep toConnectionParams and SessionApiError real; only the HTTP call is faked.
vi.mock("../api/session-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/session-api")>()),
  createSession: vi.fn(),
}))

const session: SessionResponse = {
  session_id: "session-1",
  room_name: "room-1",
  livekit_url: "wss://livekit.example.com",
  user_token: "user-token",
}

function createFakeClient() {
  return {
    connect: vi.fn().mockResolvedValue({}),
    disconnect: vi.fn().mockResolvedValue(undefined),
    sendText: vi.fn().mockResolvedValue(undefined),
  }
}

let fakeClient: ReturnType<typeof createFakeClient>
const enableMic = vi.fn()
const injectMessage = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  fakeClient = createFakeClient()
  vi.mocked(usePipecatClient).mockReturnValue(fakeClient as unknown as PipecatClient)
  vi.mocked(usePipecatClientTransportState).mockReturnValue("disconnected")
  vi.mocked(usePipecatClientMicControl).mockReturnValue({ isMicEnabled: true, enableMic })
  vi.mocked(createSession).mockResolvedValue(session)
  vi.mocked(useConversationContext).mockReturnValue({ injectMessage, botOutputSupported: null })
})

async function startCall(result: { current: ReturnType<typeof useVoiceSession> }) {
  await act(() => result.current.startCall())
}

describe("useVoiceSession", () => {
  it("derives the call status from the transport state", () => {
    vi.mocked(usePipecatClientTransportState).mockReturnValue("ready")

    const { result } = renderHook(() => useVoiceSession())

    expect(result.current.callStatus).toBe("ready")
  })

  it("starts a call by creating a session and connecting with its LiveKit credentials", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(createSession).toHaveBeenCalledOnce()
    expect(fakeClient.connect).toHaveBeenCalledWith({
      url: "wss://livekit.example.com",
      token: "user-token",
    })
  })

  it("reports connecting while the session request is in flight", async () => {
    let resolveSession: (value: SessionResponse) => void = () => {}
    vi.mocked(createSession).mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve
      })
    )
    const { result } = renderHook(() => useVoiceSession())

    let startCallPromise: Promise<void> = Promise.resolve()
    act(() => {
      startCallPromise = result.current.startCall()
    })
    expect(result.current.callStatus).toBe("connecting")

    await act(async () => {
      resolveSession(session)
      await startCallPromise
    })
  })

  it("shows the server's message when the session cannot be created", async () => {
    vi.mocked(createSession).mockRejectedValue(new SessionApiError("Server busy", 503))
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(result.current.callStatus).toBe("error")
    expect(result.current.errorMessage).toBe("Server busy")
  })

  it("shows a generic message when connecting fails", async () => {
    fakeClient.connect.mockRejectedValue(new Error("Permission denied"))
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(result.current.callStatus).toBe("error")
    expect(result.current.errorMessage).toMatch(/microphone/i)
  })

  it("clears the previous error when a new call starts", async () => {
    vi.mocked(createSession).mockRejectedValueOnce(new SessionApiError("Server busy", 503))
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)
    await startCall(result)

    expect(result.current.errorMessage).toBeUndefined()
  })

  it("ignores startCall while a call is already active", async () => {
    vi.mocked(usePipecatClientTransportState).mockReturnValue("ready")
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(createSession).not.toHaveBeenCalled()
  })

  it("reports a lost connection when the transport fails", () => {
    vi.mocked(usePipecatClientTransportState).mockReturnValue("error")

    const { result } = renderHook(() => useVoiceSession())

    expect(result.current.callStatus).toBe("error")
    expect(result.current.errorMessage).toMatch(/connection/i)
  })

  it("ends the call by disconnecting the client", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await act(() => result.current.endCall())

    expect(fakeClient.disconnect).toHaveBeenCalledOnce()
  })

  it("toggles the microphone", () => {
    const { result } = renderHook(() => useVoiceSession())

    act(() => result.current.toggleMic())

    expect(enableMic).toHaveBeenCalledWith(false)
  })

  it("sends typed text and asks for a spoken reply", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await act(() => result.current.sendText("hello"))

    expect(fakeClient.sendText).toHaveBeenCalledWith("hello", { audio_response: true })
    expect(injectMessage).toHaveBeenCalledWith({
      role: "user",
      parts: [expect.objectContaining({ text: "hello", final: true })],
    })
  })

  it("does not add the message to the transcript when sending fails", async () => {
    fakeClient.sendText.mockRejectedValue(new Error("offline"))
    const { result } = renderHook(() => useVoiceSession())

    await act(() => expect(result.current.sendText("hello")).rejects.toThrow("offline"))

    expect(injectMessage).not.toHaveBeenCalled()
  })

  it("throws when used outside PipecatClientProvider", () => {
    vi.mocked(usePipecatClient).mockReturnValue(undefined)
    vi.spyOn(console, "error").mockImplementation(() => {}) // React logs the render error

    expect(() => renderHook(() => useVoiceSession())).toThrow(/PipecatClientProvider/)
  })
})
