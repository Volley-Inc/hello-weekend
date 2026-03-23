import { describe, it, expect } from "vitest"
import { createInitialGameState } from "./state"
import { GAME_CONSTANTS } from "./constants"

describe("createInitialGameState", () => {
    it("starts in the lobby phase", () => {
        const state = createInitialGameState()
        expect(state.phase).toBe("lobby")
    })

    it("initialises score to zero", () => {
        const state = createInitialGameState()
        expect(state.score).toBe(0)
    })

    it("sets totalQuestions from GAME_CONSTANTS", () => {
        const state = createInitialGameState()
        expect(state.totalQuestions).toBe(GAME_CONSTANTS.QUESTIONS_PER_ROUND)
    })

    it("starts with no pending phase transition", () => {
        const state = createInitialGameState()
        expect(state.nextPhase).toBeNull()
    })

    it("starts with controller disconnected", () => {
        const state = createInitialGameState()
        expect(state.controllerConnected).toBe(false)
    })

    it("returns a fresh object each call (no shared references)", () => {
        const a = createInitialGameState()
        const b = createInitialGameState()
        expect(a).not.toBe(b)
        expect(a).toEqual(b)
    })
})
