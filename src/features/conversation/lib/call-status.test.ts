import type { TransportState } from "@pipecat-ai/client-js"
import { describe, expect, it } from "vitest"

import type { CallStatus } from "../types"
import { resolveCallStatus, toCallStatus } from "./call-status"

describe("toCallStatus", () => {
    it.each<[TransportState, CallStatus]>([
      ["disconnected", "idle"],
      ["initializing", "connecting"],
      ["initialized", "connecting"],
      ["authenticating", "connecting"],
      ["authenticated", "connecting"],
      ["connecting", "connecting"],
      ["connected", "connecting"],
      ["ready", "ready"],
      ["disconnecting", "ending"],
      ["error", "error"],
    ])("maps %s to %s", (transportState, expectedStatus) => {
      expect(toCallStatus(transportState)).toBe(expectedStatus)
    })
})

describe("resolveCallStatus", () => {
    it("returns the transport status when nothing else is going on", () => {
        expect(
            resolveCallStatus({ transportStatus: "ready", isStartingCall: false, hasStartError: false })
        ).toBe("ready")
    })

    it("reports connecting while the session is being created", () => {
        expect(
            resolveCallStatus({ transportStatus: "idle", isStartingCall: true, hasStartError: false })
        ).toBe("connecting")
    })

    it("reports error when the call failed to start", () => {
        expect(
            resolveCallStatus({ transportStatus: "idle", isStartingCall: false, hasStartError: true })
        ).toBe("error")
    })
})
