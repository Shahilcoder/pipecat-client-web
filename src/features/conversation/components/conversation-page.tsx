import type { BotActivity, CallStatus, ChatMessage } from "../types"
import { Composer } from "./composer"
import { ConversationHeader } from "./conversation-header"
import { EmptyState } from "./empty-state"
import { ErrorBanner } from "./error-banner"
import { MessageList } from "./message-list"

/** Everything the page renders. Fixtures provide it today; ConversationScreen will provide it from hooks. */
export interface ConversationViewState {
  callStatus: CallStatus
  botActivity: BotActivity
  messages: ChatMessage[]
  isMicEnabled: boolean
  errorMessage?: string
}

/** Everything the user can do on the page. */
export interface ConversationActions {
  onStartCall: () => void
  onEndCall: () => void
  onToggleMic: () => void
  onSendText: (text: string) => void
  onNewConversation: () => void
}

export type ConversationPageProps = ConversationViewState & ConversationActions

export function ConversationPage({
  callStatus,
  botActivity,
  messages,
  isMicEnabled,
  errorMessage,
  onStartCall,
  onEndCall,
  onToggleMic,
  onSendText,
  onNewConversation,
}: ConversationPageProps) {
  const hasMessages = messages.length > 0
  const isCallActive = callStatus === "connecting" || callStatus === "ready"

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <ConversationHeader
        callStatus={callStatus}
        canStartNewConversation={hasMessages && !isCallActive}
        onNewConversation={onNewConversation}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        {hasMessages ? (
          <MessageList messages={messages} botActivity={botActivity} />
        ) : (
          <EmptyState callStatus={callStatus} />
        )}
      </main>

      <footer>
        {errorMessage && (
          <div className="px-3">
            <ErrorBanner message={errorMessage} />
          </div>
        )}
        <Composer
          callStatus={callStatus}
          botActivity={botActivity}
          isMicEnabled={isMicEnabled}
          onStartCall={onStartCall}
          onEndCall={onEndCall}
          onToggleMic={onToggleMic}
          onSendText={onSendText}
        />
      </footer>
    </div>
  )
}
