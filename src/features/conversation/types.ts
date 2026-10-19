/** Lifecycle of one voice call, as the UI sees it. */
export type CallStatus = "idle" | "connecting" | "ready" | "ending" | "error"

/** What the bot is doing right now. Drives the activity indicator. */
export type BotActivity = "idle" | "listening" | "thinking" | "speaking"

export type ChatRole = "user" | "assistant"

/** One transcript entry, flattened from Pipecat's ConversationMessage for display. */
export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  /** False while the speech-to-text or the bot's output is still streaming. */
  isFinal: boolean
}

/** Body of `POST /sessions` on the voice-agent backend (see the backend's api/schemas.py). */
export interface SessionResponse {
  session_id: string
  room_name: string
  livekit_url: string
  user_token: string
}

/** What `PipecatClient.connect()` needs for the LiveKit transport. */
export interface ConnectionParams {
  url: string
  token: string
}
