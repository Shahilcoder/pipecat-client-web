import { PipecatClient } from "@pipecat-ai/client-js"
import { PipecatClientAudio, PipecatClientProvider } from "@pipecat-ai/client-react"
import { LiveKitTransport } from "@pipecat-ai/livekit-transport"

import { Toaster } from "@/components/ui/sonner"
import { ConversationPage } from "@/features/conversation/components/conversation-page"
import { ConversationScreen } from "@/features/conversation/components/conversation-screen"
import {
  conversationPreviews,
  isConversationPreviewName,
  previewActions,
} from "@/features/conversation/fixtures/conversation-fixtures"

// One client for the app's lifetime; PipecatClientProvider shares it with every hook.
const pipecatClient = new PipecatClient({
  transport: new LiveKitTransport(),
  enableMic: true,
  enableCam: false,
})

// Dev-only design previews: /?preview=empty|connecting|listening|thinking|speaking|muted|ended|error
const requestedPreview = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get("preview")
  : null
const previewName =
  requestedPreview && isConversationPreviewName(requestedPreview) ? requestedPreview : undefined

export function App() {
  return (
    <>
      {previewName ? (
        <ConversationPage {...conversationPreviews[previewName]} {...previewActions} />
      ) : (
        <PipecatClientProvider client={pipecatClient}>
          <ConversationScreen />
          <PipecatClientAudio />
        </PipecatClientProvider>
      )}
      <Toaster position="top-center" />
    </>
  )
}
