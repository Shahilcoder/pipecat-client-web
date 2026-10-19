import { useState } from "react"
import { toast } from "sonner"

import { useBotActivity } from "../hooks/use-bot-activity"
import { useChatMessages } from "../hooks/use-chat-messages"
import { useVoiceSession } from "../hooks/use-voice-session"
import { ConversationPage } from "./conversation-page"

export const SEND_TEXT_ERROR_MESSAGE = "Message not sent. Please try again."

/** The only component that joins Pipecat-backed hooks to the presentational page. */
export function ConversationScreen() {
  const voiceSession = useVoiceSession()
  const botActivity = useBotActivity()
  const messages = useChatMessages()
  // Pipecat clears its transcript on the next Connected event; until then we only hide it.
  const [isTranscriptHidden, setIsTranscriptHidden] = useState(false)

  function handleStartCall() {
    setIsTranscriptHidden(false)
    void voiceSession.startCall()
  }

  function handleEndCall() {
    void voiceSession.endCall()
  }

  function handleSendText(text: string) {
    voiceSession.sendText(text).catch(() => toast.error(SEND_TEXT_ERROR_MESSAGE))
  }

  return (
    <ConversationPage
      callStatus={voiceSession.callStatus}
      botActivity={botActivity}
      messages={isTranscriptHidden ? [] : messages}
      isMicEnabled={voiceSession.isMicEnabled}
      errorMessage={voiceSession.errorMessage}
      onStartCall={handleStartCall}
      onEndCall={handleEndCall}
      onToggleMic={voiceSession.toggleMic}
      onSendText={handleSendText}
      onNewConversation={() => setIsTranscriptHidden(true)}
    />
  )
}
