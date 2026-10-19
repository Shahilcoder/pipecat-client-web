import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { CallStatus } from "../types"
import { CallButton } from "./call-button"

function renderCallButton(callStatus: CallStatus) {
  const onStartCall = vi.fn()
  const onEndCall = vi.fn()
  render(<CallButton callStatus={callStatus} onStartCall={onStartCall} onEndCall={onEndCall} />)

  return { onStartCall, onEndCall }
}

describe("CallButton", () => {
  it.each<[CallStatus, string]>([
    ["idle", "Start call"],
    ["connecting", "Connecting"],
    ["ready", "End call"],
    ["ending", "Ending call"],
    ["error", "Start call"],
  ])("is labelled for %s as '%s'", (callStatus, expectedLabel) => {
    renderCallButton(callStatus)

    expect(screen.getByRole("button", { name: expectedLabel })).toBeInTheDocument()
  })

  it("starts a call when idle", async () => {
    const { onStartCall, onEndCall } = renderCallButton("idle")

    await userEvent.setup().click(screen.getByRole("button", { name: "Start call" }))

    expect(onStartCall).toHaveBeenCalledOnce()
    expect(onEndCall).not.toHaveBeenCalled()
  })

  it("ends the call when ready", async () => {
    const { onStartCall, onEndCall } = renderCallButton("ready")

    await userEvent.setup().click(screen.getByRole("button", { name: "End call" }))

    expect(onEndCall).toHaveBeenCalledOnce()
    expect(onStartCall).not.toHaveBeenCalled()
  })

  it.each<CallStatus>(["connecting", "ending"])("is disabled while %s", (callStatus) => {
    renderCallButton(callStatus)

    expect(screen.getByRole("button")).toBeDisabled()
  })
})
