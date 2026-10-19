import { useCallback, useReducer } from "react"
import { RTVIEvent } from "@pipecat-ai/client-js"
import { useRTVIClientEvent } from "@pipecat-ai/client-react"

import { botActivityReducer, initialBotActivity } from "../lib/bot-activity"

import type { BotActivity } from "../types"

/** Subscribes to RTVI speaking events and reduces them with botActivityReducer. */
export function useBotActivity(): BotActivity {
  const [botActivity, dispatch] = useReducer(botActivityReducer, initialBotActivity)

  // Stable handlers: useRTVIClientEvent re-subscribes whenever the handler identity changes.
  const handleBotReady = useCallback(() => dispatch({ type: "botReady" }), [])
  const handleUserStartedSpeaking = useCallback(() => dispatch({ type: "userStartedSpeaking" }), [])
  const handleUserStoppedSpeaking = useCallback(() => dispatch({ type: "userStoppedSpeaking" }), [])
  const handleBotStartedSpeaking = useCallback(() => dispatch({ type: "botStartedSpeaking" }), [])
  const handleBotStoppedSpeaking = useCallback(() => dispatch({ type: "botStoppedSpeaking" }), [])
  const handleDisconnected = useCallback(() => dispatch({ type: "disconnected" }), [])

  useRTVIClientEvent(RTVIEvent.BotReady, handleBotReady)
  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, handleUserStartedSpeaking)
  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, handleUserStoppedSpeaking)
  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, handleBotStartedSpeaking)
  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, handleBotStoppedSpeaking)
  useRTVIClientEvent(RTVIEvent.Disconnected, handleDisconnected)

  return botActivity
}
