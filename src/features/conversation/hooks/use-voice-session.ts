import { useCallback, useState } from "react"
import {
  useConversationContext,
  usePipecatClient,
  usePipecatClientMicControl,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react"

import { createSession, SessionApiError, toConnectionParams } from "../api/session-api"
import { resolveCallStatus, toCallStatus } from "../lib/call-status"
import type { CallStatus } from "../types"

const START_CALL_ERROR_MESSAGE = "Couldn't start the call. Check microphone access and try again."
const CONNECTION_LOST_MESSAGE = "The connection to the assistant was lost."

export interface VoiceSession {
  callStatus: CallStatus
  isMicEnabled: boolean
  errorMessage: string | undefined
  startCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMic: () => void
  sendText: (text: string) => Promise<void>
}

/** Owns the call: creates a backend session, connects the Pipecat client, exposes controls. */
export function useVoiceSession(): VoiceSession {
  const client = usePipecatClient()
  if (!client) {
    throw new Error("useVoiceSession must be used inside <PipecatClientProvider>")
  }

  const transportState = usePipecatClientTransportState()
  const { isMicEnabled, enableMic } = usePipecatClientMicControl()
  const { injectMessage } = useConversationContext()
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [startErrorMessage, setStartErrorMessage] = useState<string>()

  const transportStatus = toCallStatus(transportState)
  const callStatus = resolveCallStatus({
    transportStatus,
    isStartingCall,
    hasStartError: startErrorMessage !== undefined,
  })
  const errorMessage =
    startErrorMessage ?? (transportStatus === "error" ? CONNECTION_LOST_MESSAGE : undefined)

  const startCall = useCallback(async () => {
    if (callStatus === "connecting" || callStatus === "ready") return

    setStartErrorMessage(undefined)
    setIsStartingCall(true)
    try {
      const session = await createSession()
      await client.connect(toConnectionParams(session))
    } catch (error) {
      setStartErrorMessage(error instanceof SessionApiError ? error.message : START_CALL_ERROR_MESSAGE)
    } finally {
      setIsStartingCall(false)
    }
  }, [callStatus, client])

  const endCall = useCallback(() => client.disconnect(), [client])

  const toggleMic = useCallback(() => enableMic(!isMicEnabled), [enableMic, isMicEnabled])

  // Pipecat only records user messages from speech-to-text, so typed text is added to the transcript here.
  const sendText = useCallback(
    async (text: string) => {
      await client.sendText(text, { audio_response: true })
      injectMessage({ role: "user", parts: [{ text, final: true, createdAt: new Date().toISOString() }] })
    },
    [client, injectMessage]
  )

  return { callStatus, isMicEnabled, errorMessage, startCall, endCall, toggleMic, sendText }
}
