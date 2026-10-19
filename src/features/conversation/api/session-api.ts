import type { ConnectionParams, SessionResponse } from "../types"

/** Same-origin path; the dev server proxies it to the backend and adds X-API-Key (vite.config.ts). */
export const SESSIONS_ENDPOINT = "/api/sessions"

const ERROR_MESSAGES_BY_STATUS: Record<number, string> = {
  401: "The app isn't configured correctly (invalid API key).",
  503: "The server is busy right now. Please try again in a moment.",
}

const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again."

/** Raised for any failure to create a session. `status` is undefined for network errors. */
export class SessionApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = "SessionApiError"
    this.status = status
  }
}

/** Maps the backend's response to the LiveKit transport's connect params. */
export function toConnectionParams(session: SessionResponse): ConnectionParams {
  return {
    url: session.livekit_url,
    token: session.user_token,
  }
}

/** Starts a bot on the backend. Resolves with the session or rejects with SessionApiError. */
export async function createSession(fetchFn: typeof fetch = fetch): Promise<SessionResponse> {
  let response: Response
  try {
    response = await fetchFn(SESSIONS_ENDPOINT, { method: "POST" })
  } catch {
    throw new SessionApiError(NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    const message =
      ERROR_MESSAGES_BY_STATUS[response.status] ??
      `Couldn't start a session (HTTP ${response.status}). Please try again.`
    throw new SessionApiError(message, response.status)
  }

  return (await response.json()) as SessionResponse
}
