import { render } from "@testing-library/react"

import { describe, expect, it } from "vitest"

import type { ChatMessage } from "../types"
import { MessageItem } from "./message-item"

function assistant(text: string): ChatMessage {
  return { id: "assistant-1", role: "assistant", text, isFinal: false }
}

function wordSpans(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".animate-word-pop"))
}

describe("MessageItem", () => {
  it("pops in each word of an assistant message", () => {
    const { container } = render(<MessageItem message={assistant("Hello there friend")} />)

    expect(wordSpans(container).map((span) => span.textContent)).toEqual(["Hello", "there", "friend"])
    expect(container.textContent).toBe("Assistant: Hello there friend")
  })

  it("adds only the new word when the spoken text grows", () => {
    const { container, rerender } = render(<MessageItem message={assistant("Hello there")} />)
    const [hello, there] = wordSpans(container)

    rerender(<MessageItem message={assistant("Hello there friend")} />)
    const spans = wordSpans(container)

    expect(spans).toHaveLength(3)
    expect(spans[0]).toBe(hello)
    expect(spans[1]).toBe(there)
  })

  it("does not animate user messages", () => {
    const { container } = render(
      <MessageItem message={{ id: "user-1", role: "user", text: "Hi there", isFinal: true }} />
    )

    expect(wordSpans(container)).toHaveLength(0)
  })
})
