import { RTVIEvent } from "@pipecat-ai/client-js"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useBotActivity } from "./use-bot-activity"

// vi.mock is hoisted above imports, so shared state must be created with vi.hoisted.
const rtviHandlers = vi.hoisted(() => new Map<string, () => void>())

vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  useRTVIClientEvent: (event: string, handler: () => void) => {
    rtviHandlers.set(event, handler)
  },
}))

function emit(event: RTVIEvent) {
  act(() => {
    rtviHandlers.get(event)?.()
  })
}

describe("useBotActivity", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useBotActivity())
    expect(result.current).toBe("idle")
  })

  it("follows a full conversation turn", () => {
    const { result } = renderHook(() => useBotActivity())

    emit(RTVIEvent.BotReady)
    expect(result.current).toBe("listening")

    emit(RTVIEvent.UserStartedSpeaking)
    expect(result.current).toBe("listening")
    emit(RTVIEvent.UserStoppedSpeaking)
    expect(result.current).toBe("thinking")

    emit(RTVIEvent.BotStartedSpeaking)
    expect(result.current).toBe("speaking")

    emit(RTVIEvent.BotStoppedSpeaking)
    expect(result.current).toBe("listening")
  })

  it("goes idle when the client disconnects", () => {
    const { result } = renderHook(() => useBotActivity())

    emit(RTVIEvent.BotReady)
    emit(RTVIEvent.Disconnected)

    expect(result.current).toBe("idle")
  })
})
