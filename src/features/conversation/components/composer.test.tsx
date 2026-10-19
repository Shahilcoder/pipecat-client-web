import type { ComponentProps } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { describe, expect, it, vi } from "vitest"

import { Composer } from "./composer"

type ComposerProps = ComponentProps<typeof Composer>

function renderComposer(overrides: Partial<ComposerProps> = {}) {
  const props: ComposerProps = {
    callStatus: "ready",
    botActivity: "listening",
    isMicEnabled: true,
    onStartCall: vi.fn(),
    onEndCall: vi.fn(),
    onToggleMic: vi.fn(),
    onSendText: vi.fn(),
    ...overrides,
  }

  render(<Composer {...props} />)
  return props
}

describe("Composer", () => {
  it("disables typing until the call is ready", () => {
    renderComposer({ callStatus: "idle" })

    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
    expect(screen.getByPlaceholderText("Start a call to chat")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument()
  })

  it("sends the trimmed text on Enter and clears the box", async () => {
    const user = userEvent.setup()
    const { onSendText } = renderComposer()
    const textbox = screen.getByRole("textbox", { name: "Message" })

    await user.type(textbox, "  hello  {Enter}")

    expect(onSendText).toHaveBeenCalledExactlyOnceWith("hello")
    expect(textbox).toHaveValue("")
  })

  it("adds a newline on Shift+Enter instead of sending", async () => {
    const user = userEvent.setup()
    const { onSendText } = renderComposer()
    const textbox = screen.getByRole("textbox", { name: "Message" })

    await user.type(textbox, "hello{Shift>}{Enter}{/Shift}")

    expect(onSendText).not.toHaveBeenCalled()
    expect(textbox).toHaveValue("hello\n")
  })

  it("sends when the send button is clicked", async () => {
    const user = userEvent.setup()
    const { onSendText } = renderComposer()

    await user.type(screen.getByRole("textbox", { name: "Message" }), "hello")
    await user.click(screen.getByRole("button", { name: "Send message" }))

    expect(onSendText).toHaveBeenCalledExactlyOnceWith("hello")
  })

  it("hides the send button for whitespace-only input", async () => {
    const user = userEvent.setup()
    renderComposer()

    await user.type(screen.getByRole("textbox", { name: "Message" }), "   ")

    expect(screen.queryByRole("button", { name: "Send message" })).not.toBeInTheDocument()
  })

  it("shows the mic toggle only during a call", () => {
    renderComposer({ callStatus: "idle" })

    expect(screen.queryByRole("button", { name: "Mute microphone" })).not.toBeInTheDocument()
  })
})
