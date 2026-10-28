import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { conversationPreviews } from "../fixtures/conversation-fixtures"
import {
  ConversationPage,
  type ConversationActions,
  type ConversationViewState,
} from "./conversation-page"

function renderPage(viewState: ConversationViewState) {
  const actions: ConversationActions = {
    onStartCall: vi.fn(),
    onEndCall: vi.fn(),
    onToggleMic: vi.fn(),
    onSendText: vi.fn(),
    onNewConversation: vi.fn(),
  }
  render(<ConversationPage {...viewState} {...actions} />)
  return actions
}

describe("ConversationPage", () => {
  it("shows the empty state when there are no messages", () => {
    renderPage(conversationPreviews.empty)

    expect(screen.getByRole("heading", { name: "Hi, I'm Sprout. What's on your mind?" })).toBeInTheDocument()
    expect(screen.queryByRole("log")).not.toBeInTheDocument()
  })

  it("lists the messages in the conversation log", () => {
    renderPage(conversationPreviews.speaking)

    const log = screen.getByRole("log", { name: "Conversation" })
    expect(within(log).getByText("What time is it in London right now?")).toBeInTheDocument()
  })

  it("shows the error message as an alert", () => {
    renderPage(conversationPreviews.error)

    expect(screen.getByRole("alert")).toHaveTextContent(/server is busy/i)
  })

  it("disables New conversation when there is nothing to clear", () => {
    renderPage(conversationPreviews.empty)

    expect(screen.getByRole("button", { name: "New conversation" })).toBeDisabled()
  })

  it("disables New conversation during a call", () => {
    renderPage(conversationPreviews.speaking)

    expect(screen.getByRole("button", { name: "New conversation" })).toBeDisabled()
  })

  it("starts a new conversation after a call has ended", async () => {
    const { onNewConversation } = renderPage(conversationPreviews.ended)

    await userEvent.setup().click(screen.getByRole("button", { name: "New conversation" }))

    expect(onNewConversation).toHaveBeenCalledOnce()
  })
})
