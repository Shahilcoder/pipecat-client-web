import type { ChatMessage } from "../types"
import type {
  ConversationActions,
  ConversationViewState,
} from "../components/conversation-page"

const sampleMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    text: "Hi there! I'm your voice assistant. What can I help you with today?",
    isFinal: true,
  },
  { id: "2", role: "user", text: "What time is it in London right now?", isFinal: true },
  {
    id: "3",
    role: "assistant",
    text: "It's twenty past four in the afternoon in London. Anything else you'd like to know?",
    isFinal: true,
  },
]

/** One entry per UI state, viewable at /?preview=<name> until the real hooks are wired in. */
export const conversationPreviews = {
  empty: { callStatus: "idle", botActivity: "idle", messages: [], isMicEnabled: true },
  connecting: { callStatus: "connecting", botActivity: "idle", messages: [], isMicEnabled: true },
  listening: {
    callStatus: "ready",
    botActivity: "listening",
    messages: [
      ...sampleMessages,
      { id: "4", role: "user", text: "And what about Tok", isFinal: false },
    ],
    isMicEnabled: true,
  },
  thinking: {
    callStatus: "ready",
    botActivity: "thinking",
    messages: sampleMessages.slice(0, 2),
    isMicEnabled: true,
  },
  speaking: {
    callStatus: "ready",
    botActivity: "speaking",
    messages: sampleMessages,
    isMicEnabled: true,
  },
  muted: { callStatus: "ready", botActivity: "idle", messages: sampleMessages, isMicEnabled: false },
  ended: { callStatus: "idle", botActivity: "idle", messages: sampleMessages, isMicEnabled: true },
  error: {
    callStatus: "error",
    botActivity: "idle",
    messages: [],
    isMicEnabled: true,
    errorMessage: "The server is busy right now. Please try again in a moment.",
  },
} satisfies Record<string, ConversationViewState>

export type ConversationPreviewName = keyof typeof conversationPreviews

export function isConversationPreviewName(name: string): name is ConversationPreviewName {
  return name in conversationPreviews
}

/** Logs actions so the preview is clickable without a backend. */
export const previewActions: ConversationActions = {
  onStartCall: () => console.info("[preview] start call"),
  onEndCall: () => console.info("[preview] end call"),
  onToggleMic: () => console.info("[preview] toggle mic"),
  onSendText: (text) => console.info("[preview] send text:", text),
  onNewConversation: () => console.info("[preview] new conversation"),
}
