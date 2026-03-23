import { describe, it, expect } from "vitest"
import { createInitialGameState } from "@hello-weekend/shared"
import { globalReducers } from "./reducers"

function freshState() {
    return createInitialGameState()
}

describe("SET_NEXT_PHASE", () => {
    it("sets nextPhase to the target phase", () => {
        const state = freshState()
        const result = globalReducers.SET_NEXT_PHASE(state, {
            targetPhase: "playing",
        })
        expect(result.nextPhase).toBe("playing")
    })

    it("does not mutate the original state", () => {
        const state = freshState()
        globalReducers.SET_NEXT_PHASE(state, { targetPhase: "playing" })
        expect(state.nextPhase).toBeNull()
    })
})

describe("CLEAR_NEXT_PHASE", () => {
    it("resets nextPhase to null", () => {
        const state = { ...freshState(), nextPhase: "gameOver" }
        const result = globalReducers.CLEAR_NEXT_PHASE(state)
        expect(result.nextPhase).toBeNull()
    })
})

describe("SET_CONTROLLER_CONNECTED", () => {
    it("sets controllerConnected to true", () => {
        const state = freshState()
        const result = globalReducers.SET_CONTROLLER_CONNECTED(state, {
            connected: true,
        })
        expect(result.controllerConnected).toBe(true)
    })

    it("sets controllerConnected to false", () => {
        const state = { ...freshState(), controllerConnected: true }
        const result = globalReducers.SET_CONTROLLER_CONNECTED(state, {
            connected: false,
        })
        expect(result.controllerConnected).toBe(false)
    })
})

describe("SET_QUESTION", () => {
    it("sets all question fields and resets answer state", () => {
        const state = {
            ...freshState(),
            lastAnswerText: "previous",
            lastAnswerCorrect: true,
            transcript: "old transcript",
        }

        const result = globalReducers.SET_QUESTION(state, {
            question: "What colour is the sky?",
            questionIndex: 2,
            hintKeywords: ["blue"],
            timerStartedAt: 1000,
            timerDuration: 15000,
        })

        expect(result.currentQuestion).toBe("What colour is the sky?")
        expect(result.questionIndex).toBe(2)
        expect(result.hintKeywords).toEqual(["blue"])
        expect(result.timerStartedAt).toBe(1000)
        expect(result.timerDuration).toBe(15000)
        // Should reset answer state
        expect(result.lastAnswerText).toBeNull()
        expect(result.lastAnswerCorrect).toBeNull()
        expect(result.transcript).toBe("")
    })
})

describe("SUBMIT_ANSWER", () => {
    it("records a correct answer with updated score", () => {
        const state = freshState()
        const result = globalReducers.SUBMIT_ANSWER(state, {
            text: "blue",
            correct: true,
            score: 1,
        })

        expect(result.lastAnswerText).toBe("blue")
        expect(result.lastAnswerCorrect).toBe(true)
        expect(result.score).toBe(1)
    })

    it("records an incorrect answer without changing score", () => {
        const state = freshState()
        const result = globalReducers.SUBMIT_ANSWER(state, {
            text: "green",
            correct: false,
            score: 0,
        })

        expect(result.lastAnswerText).toBe("green")
        expect(result.lastAnswerCorrect).toBe(false)
        expect(result.score).toBe(0)
    })
})
