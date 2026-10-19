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
