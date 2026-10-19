import { describe, expect, it, vi } from "vitest"

import type { SessionResponse } from "../types"
import {
  createSession,
  SESSIONS_ENDPOINT,
  SessionApiError,
  toConnectionParams,
} from "./session-api"

const session: SessionResponse = {
  session_id: "session-1",
  room_name: "room-1",
  livekit_url: "wss://livekit.example.com",
  user_token: "user-token",
}

function respondWith(status: number, body: unknown = {}) {
  return vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

describe("toConnectionParams", () => {
  it("maps livekit_url to url and user_token to token, and nothing else", () => {
    expect(toConnectionParams(session)).toEqual({
      url: "wss://livekit.example.com",
      token: "user-token",
    })
  })
})

describe("createSession", () => {
  it("POSTs to the session endpoint", async () => {
    const fetchFn = respondWith(201, session)

    await createSession(fetchFn)

    expect(fetchFn).toHaveBeenCalledWith(
      SESSIONS_ENDPOINT,
      expect.objectContaining({ method: "POST" })
    )
  })

  it("resolves with the session body on 201", async () => {
    await expect(createSession(respondWith(201, session))).resolves.toEqual(session)
  })

  it("rejects with status 503 and a 'server is busy' message", async () => {
    const error = await createSession(respondWith(503)).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(SessionApiError)
    expect(error).toMatchObject({ status: 503, message: expect.stringMatching(/busy/i) })
  })

  it("rejects with status 401 and a configuration message", async () => {
    await expect(createSession(respondWith(401))).rejects.toMatchObject({
      status: 401,
      message: expect.stringMatching(/configured/i),
    })
  })

  it("rejects with the status for any other non-OK response", async () => {
    await expect(createSession(respondWith(500))).rejects.toMatchObject({
      status: 500,
      message: expect.stringContaining("500"),
    })
  })

  it("rejects with status undefined when the network fails", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(createSession(fetchFn)).rejects.toMatchObject({
      name: "SessionApiError",
      status: undefined,
      message: expect.stringMatching(/reach the server/i),
    })
  })
})
