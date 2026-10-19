import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MicToggleButton } from "./mic-toggle-button"

describe("MicToggleButton", () => {
  it("offers to mute when the mic is on", () => {
    render(<MicToggleButton isMicEnabled onToggleMic={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Mute microphone" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("offers to unmute and shows as pressed when the mic is off", () => {
    render(<MicToggleButton isMicEnabled={false} onToggleMic={vi.fn()} />)

    expect(screen.getByRole("button", { name: "Unmute microphone" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("calls onToggleMic when clicked", async () => {
    const onToggleMic = vi.fn()
    render(<MicToggleButton isMicEnabled onToggleMic={onToggleMic} />)

    await userEvent.setup().click(screen.getByRole("button"))

    expect(onToggleMic).toHaveBeenCalledOnce()
  })
})
