import type { TransportState } from "@pipecat-ai/client-js"

import type { CallStatus } from "../types"

const CALL_STATUS_BY_TRANSPORT_STATE: Record<TransportState, CallStatus> = {
  disconnected: "idle",
  initializing: "connecting",
  initialized: "connecting",
  authenticating: "connecting",
  authenticated: "connecting",
  connecting: "connecting",
  connected: "connecting",
  ready: "ready",
  disconnecting: "ending",
  error: "error",
}

/** Collapses Pipecat's transport states into the few states the UI renders. */
export function toCallStatus(transportState: TransportState): CallStatus {
  return CALL_STATUS_BY_TRANSPORT_STATE[transportState]
}

interface CallStatusInputs {
  transportStatus: CallStatus
  isStartingCall: boolean
  hasStartError: boolean
}

/**
 * The status the UI shows. Covers the gap before the transport moves: while POST /sessions runs
 * the transport is still "disconnected", and a failed start never reaches the transport at all.
 */
export function resolveCallStatus({
  transportStatus,
  isStartingCall,
  hasStartError,
}: CallStatusInputs): CallStatus {
  if (isStartingCall) return "connecting"
  if (hasStartError) return "error"
  return transportStatus
}
