# Voice Agent Web Client — Implementation Guide

A mobile-first React client for the `pipecat-voice-agent` backend. It uses the Sprout UI (green light theme, see `DESIGN.md`),
**Pipecat client SDK** + **LiveKit transport**, typed text over **RTVI**, and the **shadcn** + **Tailwind v4** UI kit.

Verified against `@pipecat-ai/client-js` **1.13.1**, `@pipecat-ai/client-react` **1.8.2**,
`@pipecat-ai/livekit-transport` **1.0.0**, React 19, Vite 8, Vitest 5 (2026-10-17).

**Status:** the design code is in the repo, and the page renders from fixtures. Every logic file is a typed
stub that throws `Not implemented`. **This guide contains every file you write, in full, in test-first order.**
All of its code was run before it went into this guide. The result is 90 passing tests, a clean `tsc`, a clean `oxlint` and a
working `vite build`. Against the current stubs, the 61 logic tests fail (red) as expected.

---

## 0. Architecture

```
Browser (this app)
  │ 1. tap "Start call" → POST /api/sessions        (same origin, no key in the browser)
  ▼
Vite dev server proxy ── adds X-API-Key, strips /api ──► FastAPI POST /sessions
  │ 2. {session_id, room_name, livekit_url, user_token}
  ▼
toConnectionParams() → PipecatClient.connect({ url, token })  ── WebRTC audio + RTVI data channel ──► VoiceBot
  │
  │ 3. RTVI events: TransportStateChanged, User/BotStarted/StoppedSpeaking, transcripts, BotOutput
  ▼
hooks (useVoiceSession, useBotActivity, useChatMessages) → ConversationScreen → ConversationPage (pure UI)
```

**Lifecycle (matches the backend):**
1. `client.connect()` joins the LiveKit room. Pipecat sends `client-ready` and the backend answers `bot-ready`. `connect()` resolves at that point, and the bot greets the user.
2. The user talks, or types (`client.sendText`). The bot always answers with speech, and the transcript shows both sides.
3. `client.disconnect()` leaves the room. The backend sees `on_client_disconnected` and ends the bot.
4. `usePipecatConversation` **clears its transcript automatically on the next `Connected` event.** The client-react source resets its message atoms in its `Connected` handler. "New conversation" therefore only has to hide the old transcript until the next call starts.

**Why not `client.startBotAndConnect()`?** It passes the backend response straight to `connect()`, but the
backend returns `livekit_url`/`user_token` while the LiveKit transport wants `url`/`token`. So we fetch the
session ourselves and map it with `toConnectionParams()`.

---

## 1. Who writes what

| Area | Files | Who |
|---|---|---|
| Tooling | `vite.config.ts` (proxy + Vitest), `tsconfig*.json` (`@/` alias), `.oxlintrc.json`, `index.html`, `.env.example` | done |
| Theme | `src/index.css` (Sprout tokens from `DESIGN.md`, Fredoka + Figtree, `animate-word-pop`, blob face keyframes) | done |
| shadcn UI | `src/components/ui/{button,textarea,sonner}.tsx` | done |
| Feature UI | `src/features/conversation/components/*` (presentational: props in, callbacks out) | done |
| Contracts | `types.ts`, `ConversationViewState` / `ConversationActions` | done |
| Fixtures | `fixtures/conversation-fixtures.ts` | done |
| **Logic** | `api/session-api.ts`, `lib/*.ts`, `hooks/*.ts`: **replace the stubs** | **you, section 5** |
| **Wiring** | `components/conversation-screen.tsx` (**new**), `src/app.tsx` (**replace**) | **you, section 5** |
| **Tests** | 12 `*.test.ts(x)` files (**new**) | **you, section 5** |

All paths in section 5 are relative to `src/features/conversation/` unless they start with `src/`.

---

## 2. Setup and running

```bash
npm install
cp .env.example .env        # VOICE_AGENT_URL, VOICE_AGENT_API_KEY (= backend SERVER_API_KEY)
npm run dev                  # http://localhost:5173
npm test                     # vitest in watch mode (TDD loop)
npx vitest run <file>        # run one test file once
npm run build && npm run lint
```

**Design previews** (dev only): `/?preview=` with `empty`, `connecting`, `listening`, `thinking`,
`speaking`, `muted`, `ended` or `error`. Use the browser devtools device toolbar (e.g. iPhone 14, 390×844).

**Backend:** run `uv run voice-agent` in `pipecat-voice-agent/` (port 8000), plus a LiveKit server.
`LIVEKIT_URL` in the backend `.env` is what the **browser** connects to, so it must be reachable from the
browser (e.g. `ws://localhost:7880` locally).

**Why no `VITE_` prefix:** Vite only bundles `VITE_*` variables. `vite.config.ts` reads the key with
`loadEnv(mode, cwd, "")` inside the Node dev server and adds it as a proxy header, so it never reaches client code.
Check with `npm run build && grep -r "$VOICE_AGENT_API_KEY" dist/`, which should print nothing.

---

## 3. Structure and conventions

```
src/
├── main.tsx                    # mounts <App/>, loads the font and the CSS
├── app.tsx                     # client + providers + screen (or a dev preview)
├── index.css                   # Tailwind v4 + theme tokens
├── lib/utils.ts                # cn() (shadcn)
├── test/setup.ts               # jest-dom matchers
├── components/ui/              # shadcn primitives (generated code, keep edits minimal)
└── features/conversation/
    ├── types.ts                # domain types shared by every layer
    ├── api/session-api.ts      # HTTP to the backend
    ├── lib/                    # pure functions (no React, no I/O): easiest to TDD
    ├── hooks/                  # React + Pipecat glue; thin, delegates to lib/ and api/
    ├── components/             # presentational UI; only conversation-screen.tsx touches hooks
    └── fixtures/               # design-preview data, reused in tests
```

**Dependency rule:** `components → types`; `hooks → lib, api, types`; `lib, api → types`.
Only `conversation-screen.tsx` imports both hooks and components.

**Naming:**
- Files are `kebab-case`. Components are `PascalCase`. Hooks are `useSomething`.
- Callback props are `onVerb` (`onStartCall`). Internal handlers are `handleEvent` (`handleKeyDown`).
- Booleans are `is/has/can` (`isMicEnabled`, `canSend`).
- Lookup tables are `SCREAMING_SNAKE` `Record<Union, …>`, so TypeScript forces every case.
- Tests sit next to the code: `session-api.ts` → `session-api.test.ts`. Write `describe` per unit and `it` as a sentence.

**Test style:**
- Arrange / act / assert, separated by blank lines.
- Query by role and accessible name (`getByRole("button", { name: "Start call" })`), never by CSS class.
- No network: `fetch` is injected, and Pipecat's React hooks are replaced with `vi.mock`. Partial mocks (`importOriginal`) keep everything else real.

---

## 4. TDD loop

For every step in section 5:
1. **Red:** write the test file. Run `npx vitest run <test file>` and watch it fail for the right reason: `Not implemented: …`, `… is not a function` (a new export), or `Failed to resolve import` (a new file). An error from a typo in the test doesn't count.
2. **Green:** replace the stub with the implementation shown. Run the test file again until it's green.
3. **Refactor:** clean up while it stays green, then run `npm test -- --run` to make sure nothing else broke.

You can go one `it` at a time (comment out the rest) for a stricter loop. The full files are given so you
have the finished target. Commit once per step.

---

## 5. Build order — file by file

### Step 1 — Session API (`toConnectionParams`, `createSession`)

Two pure-ish functions. `createSession` takes `fetch` as a parameter, so tests can pass a fake.
Error messages are written for the user: the page shows `error.message` as-is.

**Red — new file `api/session-api.test.ts`**

```ts
// src/features/conversation/api/session-api.test.ts
import { describe, expect, it, vi } from "vitest"

import type { SessionResponse } from "../types"
import {
  createSession,
  SESSIONS_ENDPOINT,
  SessionApiError,
  toConnectionParams,
} from "./session-api"

const session: SessionResponse = {
  session_id: "session-1",
  room_name: "room-1",
  livekit_url: "wss://livekit.example.com",
  user_token: "user-token",
}

function respondWith(status: number, body: unknown = {}) {
  return vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status }))
}

describe("toConnectionParams", () => {
  it("maps livekit_url to url and user_token to token, and nothing else", () => {
    expect(toConnectionParams(session)).toEqual({
      url: "wss://livekit.example.com",
      token: "user-token",
    })
  })
})

describe("createSession", () => {
  it("POSTs to the sessions endpoint", async () => {
    const fetchFn = respondWith(201, session)

    await createSession(fetchFn)

    expect(fetchFn).toHaveBeenCalledWith(
      SESSIONS_ENDPOINT,
      expect.objectContaining({ method: "POST" })
    )
  })

  it("resolves with the session body on 201", async () => {
    await expect(createSession(respondWith(201, session))).resolves.toEqual(session)
  })

  it("rejects with status 503 and a 'server is busy' message", async () => {
    const error = await createSession(respondWith(503)).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(SessionApiError)
    expect(error).toMatchObject({ status: 503, message: expect.stringMatching(/busy/i) })
  })

  it("rejects with status 401 and a configuration message", async () => {
    await expect(createSession(respondWith(401))).rejects.toMatchObject({
      status: 401,
      message: expect.stringMatching(/configured/i),
    })
  })

  it("rejects with the status for any other non-OK response", async () => {
    await expect(createSession(respondWith(500))).rejects.toMatchObject({
      status: 500,
      message: expect.stringContaining("500"),
    })
  })

  it("rejects with status undefined when the network fails", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(createSession(fetchFn)).rejects.toMatchObject({
      name: "SessionApiError",
      status: undefined,
      message: expect.stringMatching(/reach the server/i),
    })
  })
})
```

**Green — replace the stub `api/session-api.ts`**

```ts
// src/features/conversation/api/session-api.ts
import type { ConnectionParams, SessionResponse } from "../types"

/** Same-origin path; the dev server proxies it to the backend and adds X-API-Key (vite.config.ts). */
export const SESSIONS_ENDPOINT = "/api/sessions"

const ERROR_MESSAGES_BY_STATUS: Record<number, string> = {
  401: "The app isn't configured correctly (invalid API key).",
  503: "The server is busy right now. Please try again in a moment.",
}

const NETWORK_ERROR_MESSAGE = "Can't reach the server. Check your connection and try again."

/** Raised for any failure to create a session. `status` is undefined for network errors. */
export class SessionApiError extends Error {
  readonly status: number | undefined

  constructor(message: string, status?: number) {
    super(message)
    this.name = "SessionApiError"
    this.status = status
  }
}

/** Maps the backend's response to the LiveKit transport's connect params. */
export function toConnectionParams(session: SessionResponse): ConnectionParams {
  return { url: session.livekit_url, token: session.user_token }
}

/** Starts a bot on the backend. Resolves with the session or rejects with SessionApiError. */
export async function createSession(fetchFn: typeof fetch = fetch): Promise<SessionResponse> {
  let response: Response
  try {
    response = await fetchFn(SESSIONS_ENDPOINT, { method: "POST" })
  } catch {
    throw new SessionApiError(NETWORK_ERROR_MESSAGE)
  }

  if (!response.ok) {
    const message =
      ERROR_MESSAGES_BY_STATUS[response.status] ??
      `Couldn't start a session (HTTP ${response.status}). Please try again.`
    throw new SessionApiError(message, response.status)
  }

  return (await response.json()) as SessionResponse
}
```

*Why `try` wraps only the `fetch` call:* a `SessionApiError` thrown for a bad status is then never caught and
re-wrapped as a network error.

---

### Step 2 — Call status (`toCallStatus`, `resolveCallStatus`)

`toCallStatus` collapses Pipecat's 10 transport states into the 5 the UI draws. `resolveCallStatus` (a **new
export**) covers the two moments the transport can't see: while `POST /sessions` is running, and after a start
that failed before connecting.

**Red — new file `lib/call-status.test.ts`**

```ts
// src/features/conversation/lib/call-status.test.ts
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
```

**Green — replace the stub `lib/call-status.ts`**

```ts
// src/features/conversation/lib/call-status.ts
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
```

*Why a `Record` and not a `switch`:* if Pipecat adds a transport state, `tsc` fails right here instead of
the UI silently drawing the wrong state.

---

### Step 3 — Bot activity reducer

A pure reducer that turns RTVI speaking events into `idle | listening | thinking | speaking`. "Thinking" is the
gap between the user stopping and the bot starting. Barge-in (the user talking over the bot) goes back to listening,
because Pipecat interruptions are always on.

**Red — new file `lib/bot-activity.test.ts`**

```ts
// src/features/conversation/lib/bot-activity.test.ts
import { describe, expect, it } from "vitest"

import type { BotActivity } from "../types"
import { botActivityReducer, initialBotActivity, type BotActivityEvent } from "./bot-activity"

describe("botActivityReducer", () => {
  it("starts idle", () => {
    expect(initialBotActivity).toBe("idle")
  })

  it("starts listening when the bot is ready", () => {
    expect(botActivityReducer("idle", { type: "botReady" })).toBe("listening")
  })

  it("listens while the user speaks", () => {
    expect(botActivityReducer("listening", { type: "userStartedSpeaking" })).toBe("listening")
  })

  it("thinks after the user stops speaking", () => {
    expect(botActivityReducer("listening", { type: "userStoppedSpeaking" })).toBe("thinking")
  })

  it.each<BotActivity>(["listening", "thinking", "speaking"])(
    "speaks when the bot starts speaking (from %s)",
    (state) => {
      expect(botActivityReducer(state, { type: "botStartedSpeaking" })).toBe("speaking")
    }
  )

  it("listens again when the bot stops speaking", () => {
    expect(botActivityReducer("speaking", { type: "botStoppedSpeaking" })).toBe("listening")
  })

  it("listens when the user interrupts the bot", () => {
    expect(botActivityReducer("speaking", { type: "userStartedSpeaking" })).toBe("listening")
  })

  it.each<BotActivity>(["listening", "thinking", "speaking"])(
    "goes idle on disconnect (from %s)",
    (state) => {
      expect(botActivityReducer(state, { type: "disconnected" })).toBe("idle")
    }
  )

  it.each<BotActivityEvent["type"]>([
    "userStartedSpeaking",
    "userStoppedSpeaking",
    "botStartedSpeaking",
    "botStoppedSpeaking",
    "disconnected",
  ])("stays idle on a late %s event", (type) => {
    expect(botActivityReducer("idle", { type } as BotActivityEvent)).toBe("idle")
  })
})
```

**Green — replace the stub `lib/bot-activity.ts`**

```ts
// src/features/conversation/lib/bot-activity.ts
import type { BotActivity } from "../types"

/** RTVI events that change what the bot is doing. Each maps to one RTVIEvent the hook subscribes to. */
export type BotActivityEvent =
  | { type: "botReady" }
  | { type: "userStartedSpeaking" }
  | { type: "userStoppedSpeaking" }
  | { type: "botStartedSpeaking" }
  | { type: "botStoppedSpeaking" }
  | { type: "disconnected" }

export const initialBotActivity: BotActivity = "idle"

/** Pure state transition; the hook feeds it to useReducer. */
export function botActivityReducer(state: BotActivity, event: BotActivityEvent): BotActivity {
  // Until the bot is ready (or after hang-up), late speaking events must not wake the UI.
  if (state === "idle" && event.type !== "botReady") return state

  switch (event.type) {
    case "botReady":
    case "userStartedSpeaking":
    case "botStoppedSpeaking":
      return "listening"
    case "userStoppedSpeaking":
      return state === "listening" ? "thinking" : state
    case "botStartedSpeaking":
      return "speaking"
    case "disconnected":
      return "idle"
    default: {
      const unreachable: never = event
      return unreachable
    }
  }
}
```

*The `never` default* makes `tsc` fail if someone adds a `BotActivityEvent` without handling it.

---

### Step 4 — Transcript mapping (`toChatMessages`)

This is the only file that knows Pipecat's `ConversationMessage` shape. Two facts were checked in the client-react source:
- **Assistant parts** are `BotOutputText` (`{ spoken, unspoken }`). The hook already adds the space between segments to `spoken`, so the parts are joined as-is. `spoken + unspoken` shows the full sentence before the speech engine has finished saying it.
- **User parts** are plain strings, one per transcript segment, with no separator. They are joined with a space.

**Red — new file `lib/chat-messages.test.ts`**

```ts
// src/features/conversation/lib/chat-messages.test.ts
import type { ConversationMessage, ConversationMessagePart } from "@pipecat-ai/client-react"
import { describe, expect, it } from "vitest"

import { toChatMessages } from "./chat-messages"

const CREATED_AT = "2026-10-17T10:00:00.000Z"

function buildPart(text: ConversationMessagePart["text"]): ConversationMessagePart {
  return { text, final: true, createdAt: CREATED_AT }
}

function buildMessage(overrides: Partial<ConversationMessage>): ConversationMessage {
  return { role: "assistant", final: true, createdAt: CREATED_AT, parts: [], ...overrides }
}

describe("toChatMessages", () => {
  it("returns an empty list for an empty transcript", () => {
    expect(toChatMessages([])).toEqual([])
  })

  it("keeps user and assistant messages and drops system and function_call ones", () => {
    const messages = [
      buildMessage({ role: "system", parts: [buildPart("You are helpful")] }),
      buildMessage({ role: "user", parts: [buildPart("Hi")] }),
      buildMessage({ role: "function_call", parts: [buildPart("get_current_time")] }),
      buildMessage({ role: "assistant", parts: [buildPart({ spoken: "Hello!", unspoken: "" })] }),
    ]

    expect(toChatMessages(messages).map((message) => message.role)).toEqual(["user", "assistant"])
  })

  it("joins user transcript segments with a space", () => {
    const [message] = toChatMessages([
      buildMessage({ role: "user", parts: [buildPart("What time"), buildPart("is it?")] }),
    ])

    expect(message.text).toBe("What time is it?")
  })

  it("shows spoken and not-yet-spoken bot output together", () => {
    const [message] = toChatMessages([
      buildMessage({ parts: [buildPart({ spoken: "It's four ", unspoken: "in London." })] }),
    ])

    expect(message.text).toBe("It's four in London.")
  })

  it("joins bot output parts as-is because Pipecat already adds the separator", () => {
    const [message] = toChatMessages([
      buildMessage({
        parts: [
          buildPart({ spoken: "Hello.", unspoken: "" }),
          buildPart({ spoken: " How are you?", unspoken: "" }),
        ],
      }),
    ])

    expect(message.text).toBe("Hello. How are you?")
  })

  it("treats a message without a final flag as final", () => {
    const [injected, streaming] = toChatMessages([
      buildMessage({ final: undefined, parts: [buildPart("Injected")] }),
      buildMessage({ role: "user", final: false, parts: [buildPart("Still talk")] }),
    ])

    expect(injected.isFinal).toBe(true)
    expect(streaming.isFinal).toBe(false)
  })

  it("keeps the same id while a message streams in", () => {
    const partial = buildMessage({ parts: [buildPart({ spoken: "", unspoken: "Hel" })] })
    const complete = buildMessage({ parts: [buildPart({ spoken: "Hello", unspoken: "" })] })

    expect(toChatMessages([partial])[0].id).toBe(toChatMessages([complete])[0].id)
  })

  it("drops messages with no text", () => {
    const messages = [
      buildMessage({ role: "user", parts: [] }),
      buildMessage({ parts: [buildPart({ spoken: "  ", unspoken: "" })] }),
    ]

    expect(toChatMessages(messages)).toEqual([])
  })
})
```

**Green — replace the stub `lib/chat-messages.ts`**

```ts
// src/features/conversation/lib/chat-messages.ts
import type {
  BotOutputText,
  ConversationMessage,
  ConversationMessagePart,
} from "@pipecat-ai/client-react"

import type { ChatMessage, ChatRole } from "../types"

function isChatRole(role: ConversationMessage["role"]): role is ChatRole {
  return role === "user" || role === "assistant"
}

function isBotOutputText(text: unknown): text is BotOutputText {
  return typeof text === "object" && text !== null && "spoken" in text && "unspoken" in text
}

/**
 * Bot output parts already carry their separator (the hook prepends it to `spoken`), so they join
 * as-is. Plain string parts (user transcript segments) are separate utterances and get a space.
 */
function getPartText({ text }: ConversationMessagePart): string {
  if (isBotOutputText(text)) return text.spoken + text.unspoken
  if (typeof text === "string") return ` ${text}`
  return ""
}

function getMessageText(message: ConversationMessage): string {
  return message.parts.map(getPartText).join("").trim()
}

/** Flattens Pipecat's transcript into display messages: user and assistant only, text parts joined. */
export function toChatMessages(messages: ConversationMessage[]): ChatMessage[] {
  return messages.flatMap((message) => {
    const { role } = message
    if (!isChatRole(role)) return []

    const text = getMessageText(message)
    if (!text) return []

    return [
      {
        // createdAt never changes while a message streams, so React keeps the same element.
        id: `${role}-${message.createdAt}`,
        role,
        text,
        isFinal: message.final !== false,
      },
    ]
  })
}
```

*Verify against reality once:* log `messages` in a real session (step 10). If what you see differs from the fixtures
above, paste the real message into a new test.

---

### Step 5 — Component tests (characterize the finished design)

The components already exist, so these tests are **green immediately**. They are characterization tests:
they lock the design's behaviour (Enter sends, Shift+Enter adds a newline, button states) so later changes can't
break it silently. To prove each test can fail, break the component on purpose (e.g. delete `.trim()` in
`composer.tsx`), see the test go red, then undo.

**New file `components/composer.test.tsx`**

```tsx
// src/features/conversation/components/composer.test.tsx
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
```

**New file `components/call-button.test.tsx`**

```tsx
// src/features/conversation/components/call-button.test.tsx
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
```

**New file `components/mic-toggle-button.test.tsx`**

```tsx
// src/features/conversation/components/mic-toggle-button.test.tsx
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
```

**New file `components/conversation-page.test.tsx`**

```tsx
// src/features/conversation/components/conversation-page.test.tsx
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

    expect(screen.getByRole("heading", { name: "How can I help you today?" })).toBeInTheDocument()
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
```

---

### Step 6 — `useChatMessages`

A thin hook: Pipecat's transcript → `toChatMessages`. The test mocks only `usePipecatConversation` and keeps
the rest of client-react real.

**Red — new file `hooks/use-chat-messages.test.ts`**

```ts
// src/features/conversation/hooks/use-chat-messages.test.ts
import type { ConversationMessage } from "@pipecat-ai/client-react"
import { usePipecatConversation } from "@pipecat-ai/client-react"
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useChatMessages } from "./use-chat-messages"

vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  usePipecatConversation: vi.fn(),
}))

const messages: ConversationMessage[] = [
  {
    role: "user",
    final: true,
    createdAt: "2026-10-17T10:00:00.000Z",
    parts: [{ text: "Hi", final: true, createdAt: "2026-10-17T10:00:00.000Z" }],
  },
]

function mockConversation(conversationMessages: ConversationMessage[]) {
  vi.mocked(usePipecatConversation).mockReturnValue({
    messages: conversationMessages,
    injectMessage: vi.fn(),
    botOutputEvents: new Map(),
  })
}

describe("useChatMessages", () => {
  it("returns the Pipecat transcript as chat messages", () => {
    mockConversation(messages)

    const { result } = renderHook(() => useChatMessages())

    expect(result.current).toEqual([
      { id: "user-2026-10-17T10:00:00.000Z", role: "user", text: "Hi", isFinal: true },
    ])
  })

  it("keeps the same array while the transcript is unchanged", () => {
    mockConversation(messages)

    const { result, rerender } = renderHook(() => useChatMessages())
    const firstResult = result.current
    rerender()

    expect(result.current).toBe(firstResult)
  })
})
```

**Green — replace the stub `hooks/use-chat-messages.ts`**

```ts
// src/features/conversation/hooks/use-chat-messages.ts
import { useMemo } from "react"
import { usePipecatConversation } from "@pipecat-ai/client-react"

import { toChatMessages } from "../lib/chat-messages"
import type { ChatMessage } from "../types"

/** The live transcript from usePipecatConversation, mapped with toChatMessages. */
export function useChatMessages(): ChatMessage[] {
  const { messages } = usePipecatConversation()
  return useMemo(() => toChatMessages(messages), [messages])
}
```

---

### Step 7 — `useBotActivity`

The test replaces `useRTVIClientEvent` with a fake that records each handler, so it can fire events by hand.
`vi.hoisted` is needed because `vi.mock` runs before the file's other top-level code.

**Red — new file `hooks/use-bot-activity.test.ts`**

```ts
// src/features/conversation/hooks/use-bot-activity.test.ts
import { RTVIEvent } from "@pipecat-ai/client-js"
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useBotActivity } from "./use-bot-activity"

// vi.mock is hoisted above imports, so shared state must be created with vi.hoisted.
const rtviHandlers = vi.hoisted(() => new Map<string, () => void>())

vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  useRTVIClientEvent: (event: string, handler: () => void) => {
    rtviHandlers.set(event, handler)
  },
}))

function emit(event: RTVIEvent) {
  act(() => {
    rtviHandlers.get(event)?.()
  })
}

describe("useBotActivity", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useBotActivity())

    expect(result.current).toBe("idle")
  })

  it("follows a full conversation turn", () => {
    const { result } = renderHook(() => useBotActivity())

    emit(RTVIEvent.BotReady)
    expect(result.current).toBe("listening")

    emit(RTVIEvent.UserStartedSpeaking)
    emit(RTVIEvent.UserStoppedSpeaking)
    expect(result.current).toBe("thinking")

    emit(RTVIEvent.BotStartedSpeaking)
    expect(result.current).toBe("speaking")

    emit(RTVIEvent.BotStoppedSpeaking)
    expect(result.current).toBe("listening")
  })

  it("goes idle when the client disconnects", () => {
    const { result } = renderHook(() => useBotActivity())

    emit(RTVIEvent.BotReady)
    emit(RTVIEvent.Disconnected)

    expect(result.current).toBe("idle")
  })
})
```

**Green — replace the stub `hooks/use-bot-activity.ts`**

```ts
// src/features/conversation/hooks/use-bot-activity.ts
import { useCallback, useReducer } from "react"
import { RTVIEvent } from "@pipecat-ai/client-js"
import { useRTVIClientEvent } from "@pipecat-ai/client-react"

import { botActivityReducer, initialBotActivity } from "../lib/bot-activity"
import type { BotActivity } from "../types"

/** Subscribes to RTVI speaking events and reduces them with botActivityReducer. */
export function useBotActivity(): BotActivity {
  const [botActivity, dispatch] = useReducer(botActivityReducer, initialBotActivity)

  // Stable handlers: useRTVIClientEvent re-subscribes whenever the handler identity changes.
  const handleBotReady = useCallback(() => dispatch({ type: "botReady" }), [])
  const handleUserStartedSpeaking = useCallback(() => dispatch({ type: "userStartedSpeaking" }), [])
  const handleUserStoppedSpeaking = useCallback(() => dispatch({ type: "userStoppedSpeaking" }), [])
  const handleBotStartedSpeaking = useCallback(() => dispatch({ type: "botStartedSpeaking" }), [])
  const handleBotStoppedSpeaking = useCallback(() => dispatch({ type: "botStoppedSpeaking" }), [])
  const handleDisconnected = useCallback(() => dispatch({ type: "disconnected" }), [])

  useRTVIClientEvent(RTVIEvent.BotReady, handleBotReady)
  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, handleUserStartedSpeaking)
  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, handleUserStoppedSpeaking)
  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, handleBotStartedSpeaking)
  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, handleBotStoppedSpeaking)
  useRTVIClientEvent(RTVIEvent.Disconnected, handleDisconnected)

  return botActivity
}
```

---

### Step 8 — `useVoiceSession`

This hook owns the call. Behaviour:
- `startCall` runs `createSession()`, then `client.connect(toConnectionParams(session))`. It is ignored while a call is active, which stops double taps creating two sessions.
- A failed start sets `callStatus: "error"`. A `SessionApiError` shows the server's message; anything else (mic permission denied, LiveKit unreachable) shows a generic one.
- A transport that fails mid-call gives `"error"` plus a "connection lost" message.
- `sendText` asks for a spoken reply (`audio_response: true`).
- Outside `<PipecatClientProvider>` the hook throws, because that is a wiring bug and should fail loudly.

**Red — new file `hooks/use-voice-session.test.ts`**

```ts
// src/features/conversation/hooks/use-voice-session.test.ts
import type { PipecatClient } from "@pipecat-ai/client-js"
import {
  usePipecatClient,
  usePipecatClientMicControl,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createSession, SessionApiError } from "../api/session-api"
import type { SessionResponse } from "../types"
import { useVoiceSession } from "./use-voice-session"

vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  usePipecatClient: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
  usePipecatClientMicControl: vi.fn(),
}))

// Keep toConnectionParams and SessionApiError real; only the HTTP call is faked.
vi.mock("../api/session-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/session-api")>()),
  createSession: vi.fn(),
}))

const session: SessionResponse = {
  session_id: "session-1",
  room_name: "room-1",
  livekit_url: "wss://livekit.example.com",
  user_token: "user-token",
}

function createFakeClient() {
  return {
    connect: vi.fn().mockResolvedValue({}),
    disconnect: vi.fn().mockResolvedValue(undefined),
    sendText: vi.fn().mockResolvedValue(undefined),
  }
}

let fakeClient: ReturnType<typeof createFakeClient>
const enableMic = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  fakeClient = createFakeClient()
  vi.mocked(usePipecatClient).mockReturnValue(fakeClient as unknown as PipecatClient)
  vi.mocked(usePipecatClientTransportState).mockReturnValue("disconnected")
  vi.mocked(usePipecatClientMicControl).mockReturnValue({ isMicEnabled: true, enableMic })
  vi.mocked(createSession).mockResolvedValue(session)
})

async function startCall(result: { current: ReturnType<typeof useVoiceSession> }) {
  await act(() => result.current.startCall())
}

describe("useVoiceSession", () => {
  it("derives the call status from the transport state", () => {
    vi.mocked(usePipecatClientTransportState).mockReturnValue("ready")

    const { result } = renderHook(() => useVoiceSession())

    expect(result.current.callStatus).toBe("ready")
  })

  it("starts a call by creating a session and connecting with its LiveKit credentials", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(createSession).toHaveBeenCalledOnce()
    expect(fakeClient.connect).toHaveBeenCalledWith({
      url: "wss://livekit.example.com",
      token: "user-token",
    })
  })

  it("reports connecting while the session request is in flight", async () => {
    let resolveSession: (value: SessionResponse) => void = () => {}
    vi.mocked(createSession).mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve
      })
    )
    const { result } = renderHook(() => useVoiceSession())

    let startCallPromise: Promise<void> = Promise.resolve()
    act(() => {
      startCallPromise = result.current.startCall()
    })
    expect(result.current.callStatus).toBe("connecting")

    await act(async () => {
      resolveSession(session)
      await startCallPromise
    })
  })

  it("shows the server's message when the session cannot be created", async () => {
    vi.mocked(createSession).mockRejectedValue(new SessionApiError("Server busy", 503))
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(result.current.callStatus).toBe("error")
    expect(result.current.errorMessage).toBe("Server busy")
  })

  it("shows a generic message when connecting fails", async () => {
    fakeClient.connect.mockRejectedValue(new Error("Permission denied"))
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(result.current.callStatus).toBe("error")
    expect(result.current.errorMessage).toMatch(/microphone/i)
  })

  it("clears the previous error when a new call starts", async () => {
    vi.mocked(createSession).mockRejectedValueOnce(new SessionApiError("Server busy", 503))
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)
    await startCall(result)

    expect(result.current.errorMessage).toBeUndefined()
  })

  it("ignores startCall while a call is already active", async () => {
    vi.mocked(usePipecatClientTransportState).mockReturnValue("ready")
    const { result } = renderHook(() => useVoiceSession())

    await startCall(result)

    expect(createSession).not.toHaveBeenCalled()
  })

  it("reports a lost connection when the transport fails", () => {
    vi.mocked(usePipecatClientTransportState).mockReturnValue("error")

    const { result } = renderHook(() => useVoiceSession())

    expect(result.current.callStatus).toBe("error")
    expect(result.current.errorMessage).toMatch(/connection/i)
  })

  it("ends the call by disconnecting the client", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await act(() => result.current.endCall())

    expect(fakeClient.disconnect).toHaveBeenCalledOnce()
  })

  it("toggles the microphone", () => {
    const { result } = renderHook(() => useVoiceSession())

    act(() => result.current.toggleMic())

    expect(enableMic).toHaveBeenCalledWith(false)
  })

  it("sends typed text and asks for a spoken reply", async () => {
    const { result } = renderHook(() => useVoiceSession())

    await act(() => result.current.sendText("hello"))

    expect(fakeClient.sendText).toHaveBeenCalledWith("hello", { audio_response: true })
  })

  it("throws when used outside PipecatClientProvider", () => {
    vi.mocked(usePipecatClient).mockReturnValue(undefined)
    vi.spyOn(console, "error").mockImplementation(() => {}) // React logs the render error

    expect(() => renderHook(() => useVoiceSession())).toThrow(/PipecatClientProvider/)
  })
})
```

**Green — replace the stub `hooks/use-voice-session.ts`**

```ts
// src/features/conversation/hooks/use-voice-session.ts
import { useCallback, useState } from "react"
import {
  usePipecatClient,
  usePipecatClientMicControl,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react"

import { createSession, SessionApiError, toConnectionParams } from "../api/session-api"
import { resolveCallStatus, toCallStatus } from "../lib/call-status"
import type { CallStatus } from "../types"

const START_CALL_ERROR_MESSAGE = "Couldn't start the call. Check microphone access and try again."
const CONNECTION_LOST_MESSAGE = "The connection to the assistant was lost."

export interface VoiceSession {
  callStatus: CallStatus
  isMicEnabled: boolean
  errorMessage: string | undefined
  startCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMic: () => void
  sendText: (text: string) => Promise<void>
}

/** Owns the call: creates a backend session, connects the Pipecat client, exposes controls. */
export function useVoiceSession(): VoiceSession {
  const client = usePipecatClient()
  if (!client) {
    throw new Error("useVoiceSession must be used inside <PipecatClientProvider>")
  }

  const transportState = usePipecatClientTransportState()
  const { isMicEnabled, enableMic } = usePipecatClientMicControl()
  const [isStartingCall, setIsStartingCall] = useState(false)
  const [startErrorMessage, setStartErrorMessage] = useState<string>()

  const transportStatus = toCallStatus(transportState)
  const callStatus = resolveCallStatus({
    transportStatus,
    isStartingCall,
    hasStartError: startErrorMessage !== undefined,
  })
  const errorMessage =
    startErrorMessage ?? (transportStatus === "error" ? CONNECTION_LOST_MESSAGE : undefined)

  const startCall = useCallback(async () => {
    if (callStatus === "connecting" || callStatus === "ready") return

    setStartErrorMessage(undefined)
    setIsStartingCall(true)
    try {
      const session = await createSession()
      await client.connect(toConnectionParams(session))
    } catch (error) {
      setStartErrorMessage(error instanceof SessionApiError ? error.message : START_CALL_ERROR_MESSAGE)
    } finally {
      setIsStartingCall(false)
    }
  }, [callStatus, client])

  const endCall = useCallback(() => client.disconnect(), [client])

  const toggleMic = useCallback(() => enableMic(!isMicEnabled), [enableMic, isMicEnabled])

  const sendText = useCallback(
    (text: string) => client.sendText(text, { audio_response: true }),
    [client]
  )

  return { callStatus, isMicEnabled, errorMessage, startCall, endCall, toggleMic, sendText }
}
```

---

### Step 9 — `ConversationScreen` (container)

This is the only component that joins hooks to the page. "New conversation" just hides the transcript, since Pipecat
clears it on the next connect. Typed text that fails to send shows a toast. Call-level errors use the
inline banner.

**Red — new file `components/conversation-screen.test.tsx`** (fails with `Failed to resolve import` until the next file exists)

```tsx
// src/features/conversation/components/conversation-screen.test.tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Toaster } from "@/components/ui/sonner"

import { useBotActivity } from "../hooks/use-bot-activity"
import { useChatMessages } from "../hooks/use-chat-messages"
import { useVoiceSession, type VoiceSession } from "../hooks/use-voice-session"
import type { ChatMessage } from "../types"
import { ConversationScreen, SEND_TEXT_ERROR_MESSAGE } from "./conversation-screen"

// No factory: Vitest replaces every export with a vi.fn().
vi.mock("../hooks/use-voice-session")
vi.mock("../hooks/use-bot-activity")
vi.mock("../hooks/use-chat-messages")

const messages: ChatMessage[] = [{ id: "1", role: "user", text: "Hi there", isFinal: true }]

function mockVoiceSession(overrides: Partial<VoiceSession> = {}): VoiceSession {
  const voiceSession: VoiceSession = {
    callStatus: "idle",
    isMicEnabled: true,
    errorMessage: undefined,
    startCall: vi.fn().mockResolvedValue(undefined),
    endCall: vi.fn().mockResolvedValue(undefined),
    toggleMic: vi.fn(),
    sendText: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  vi.mocked(useVoiceSession).mockReturnValue(voiceSession)
  return voiceSession
}

beforeEach(() => {
  vi.mocked(useBotActivity).mockReturnValue("idle")
  vi.mocked(useChatMessages).mockReturnValue(messages)
})

describe("ConversationScreen", () => {
  it("starts a call from the call button", async () => {
    const { startCall } = mockVoiceSession()
    render(<ConversationScreen />)

    await userEvent.setup().click(screen.getByRole("button", { name: "Start call" }))

    expect(startCall).toHaveBeenCalledOnce()
  })

  it("hides the old transcript when a new conversation starts", async () => {
    mockVoiceSession()
    render(<ConversationScreen />)

    await userEvent.setup().click(screen.getByRole("button", { name: "New conversation" }))

    expect(screen.queryByText("Hi there")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "How can I help you today?" })).toBeInTheDocument()
  })

  it("shows the session error as an alert", () => {
    mockVoiceSession({ callStatus: "error", errorMessage: "Server busy" })
    render(<ConversationScreen />)

    expect(screen.getByRole("alert")).toHaveTextContent("Server busy")
  })

  it("shows a toast when typed text cannot be sent", async () => {
    mockVoiceSession({
      callStatus: "ready",
      sendText: vi.fn().mockRejectedValue(new Error("Data channel closed")),
    })
    render(
      <>
        <ConversationScreen />
        <Toaster />
      </>
    )

    await userEvent.setup().type(screen.getByRole("textbox", { name: "Message" }), "hi{Enter}")

    expect(await screen.findByText(SEND_TEXT_ERROR_MESSAGE)).toBeInTheDocument()
  })
})
```

**Green — new file `components/conversation-screen.tsx`**

```tsx
// src/features/conversation/components/conversation-screen.tsx
import { useState } from "react"
import { toast } from "sonner"

import { useBotActivity } from "../hooks/use-bot-activity"
import { useChatMessages } from "../hooks/use-chat-messages"
import { useVoiceSession } from "../hooks/use-voice-session"
import { ConversationPage } from "./conversation-page"

export const SEND_TEXT_ERROR_MESSAGE = "Message not sent. Please try again."

/** The only component that joins Pipecat-backed hooks to the presentational page. */
export function ConversationScreen() {
  const voiceSession = useVoiceSession()
  const botActivity = useBotActivity()
  const messages = useChatMessages()
  // Pipecat clears its transcript on the next Connected event; until then we only hide it.
  const [isTranscriptHidden, setIsTranscriptHidden] = useState(false)

  function handleStartCall() {
    setIsTranscriptHidden(false)
    void voiceSession.startCall()
  }

  function handleEndCall() {
    void voiceSession.endCall()
  }

  function handleSendText(text: string) {
    voiceSession.sendText(text).catch(() => toast.error(SEND_TEXT_ERROR_MESSAGE))
  }

  return (
    <ConversationPage
      callStatus={voiceSession.callStatus}
      botActivity={botActivity}
      messages={isTranscriptHidden ? [] : messages}
      isMicEnabled={voiceSession.isMicEnabled}
      errorMessage={voiceSession.errorMessage}
      onStartCall={handleStartCall}
      onEndCall={handleEndCall}
      onToggleMic={voiceSession.toggleMic}
      onSendText={handleSendText}
      onNewConversation={() => setIsTranscriptHidden(true)}
    />
  )
}
```

---

### Step 10 — `src/app.tsx` (wire up Pipecat)

Create the `PipecatClient` **once at module level**: it's a singleton, and every hook reads it from the provider.
`<PipecatClientAudio />` plays the bot's audio track; without it you hear nothing. The `?preview=` design
states stay available, but only in `npm run dev`.

**Replace `src/app.tsx`**

```tsx
// src/app.tsx
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
```

**Final check:**

```bash
npm test -- --run        # 12 files, 90 tests
npm run build && npm run lint
```

`vite build` warns that one chunk is over 500 kB. That is `livekit-client`, and it's harmless. Split it with
`build.rollupOptions.output.manualChunks` if load time matters.

**End-to-end check (backend + LiveKit running, `npm run dev`):**
1. Tap Start call. The status goes Connecting → Live, and the greeting is spoken and transcribed.
2. Talk. The activity label goes Listening → Thinking → Speaking.
3. Ask "what time is it in Tokyo" to exercise the backend's tool call.
4. Type a message and hear the reply.
5. Mute and unmute.
6. End the call, and check the backend log shows "Client left room".
7. Tap New conversation, and the empty state shows.
8. Stop the backend and tap Start call. The banner shows an error. The dev proxy answers a dead backend with a 5xx response, not a network failure.

---

## 6. Production and mobile devices

**Proxy in prod.** The Vite proxy only exists in `npm run dev` / `npm run preview`. Serve `dist/` behind a
reverse proxy that does the same job, for example nginx:

```nginx
location /api/ {
    proxy_pass http://voice-agent:8000/;               # trailing slash strips /api
    proxy_set_header X-API-Key ${VOICE_AGENT_API_KEY}; # render with envsubst at container start
}
location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
}
```

**Testing on a phone:**
- `getUserMedia` (the microphone) needs a **secure context**. `http://192.168.x.x` won't work; only `localhost` is exempt. Either run `npm run dev -- --host` with `@vitejs/plugin-basic-ssl`, or use a tunnel (cloudflared/ngrok) to `localhost:5173`.
- The backend's `LIVEKIT_URL` must be reachable **from the phone**, and must be `wss://` if the page is HTTPS (otherwise the browser blocks it as mixed content).
- iOS only plays audio after a user gesture. The call starts from a tap, which satisfies that.

---

## 7. Known limits and when to revisit

- **Anyone who can load the site can start sessions.** The proxy hides the key but doesn't authenticate users. Add user auth or rate limiting at the proxy before going public. The backend's capacity limit (503) is the only guard today.
- **No history.** A transcript lasts until the next call or a page reload. Persist `ChatMessage[]` if you need it.
- **Tool calls are hidden** (`function_call` messages are dropped in step 4). To show tool chips, add a `role: "tool"` to `ChatMessage` and a `MessageItem` branch.
- **Old transcript flash.** After New conversation, starting a call shows the old transcript for a moment, until Pipecat's `Connected` event clears it. Keep the transcript hidden until the first new message arrives if that bothers you.
- **`field-sizing: content`** auto-grows the composer natively. Browsers without it scroll inside `max-h-40` instead.
- **Reconnects.** If the network drops, the call ends and the user taps Start call again. Revisit if this shows up in real usage.
