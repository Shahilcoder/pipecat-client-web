import type { BotActivity } from "../types"

/** RTVI events that change what the bot is doing. Each maps to one RTVIEvent the hook subscribes to. */
export type BotActivityEvent =
  | { type: "botReady" }
  | { type: "userStartedSpeaking" }
  | { type: "userStoppedSpeaking" }
  | { type: "botStartedSpeaking" }
  | { type: "botStoppedSpeaking" }
  | { type: "disconnected" }

export const initialBotActivity: BotActivity = "idle"

/** Pure state transition; the hook feeds it to useReducer. */
export function botActivityReducer(state: BotActivity, event: BotActivityEvent): BotActivity {
  // Until the bot is ready (or after hang-up), late speaking events must not wake the UI.
  if (state === "idle" && event.type !== "botReady") return state

  switch (event.type) {
    case "botReady":
    case "userStartedSpeaking":
    case "botStoppedSpeaking":
      return "listening"
    case "userStoppedSpeaking":
      return state === "listening" ? "thinking" : state
    case "botStartedSpeaking":
      return "speaking"
    case "disconnected":
      return "idle"
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}
