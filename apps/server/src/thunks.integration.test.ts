import { describe, it, expect, vi, beforeEach } from "vitest"
import { createInitialGameState, GAME_CONSTANTS } from "@hello-weekend/shared"
import type { HelloWeekendState, ServerOnlyState } from "@hello-weekend/shared"
import type { GameServices } from "./services"
import { createStartGameThunk, createProcessTranscriptionThunk } from "./thunks"

// Stub getRandomQuestions so tests are deterministic
vi.mock("./questions", () => ({
    getRandomQuestions: vi.fn().mockReturnValue([
        { question: "What colour is the sky?", answer: "blue", keywords: ["sky", "azure"] },
        { question: "What is 2+2?", answer: "four", keywords: ["4"] },
        { question: "Capital of France?", answer: "paris", keywords: ["france"] },
        { question: "Largest ocean?", answer: "pacific", keywords: ["ocean"] },
        { question: "Boiling point of water?", answer: "100", keywords: ["boiling", "degrees"] },
    ]),
}))

function createMockTracking() {
    return {
        trackGameStart: vi.fn(),
        trackGameEnd: vi.fn(),
        trackSessionStart: vi.fn(),
        trackSessionEnd: vi.fn(),
        trackPhaseTransition: vi.fn(),
        trackQuestionAnswered: vi.fn(),
        trackCommandRequested: vi.fn(),
        trackControllerConnected: vi.fn(),
        trackControllerDisconnected: vi.fn(),
        flush: vi.fn().mockResolvedValue(undefined),
    }
}

function createMockMetrics() {
    return {
        gaugeActiveSessions: vi.fn(),
        gaugeConnectedClients: vi.fn(),
        histogramThunkDuration: vi.fn(),
        close: vi.fn(),
    }
}

function createMockCtx(stateOverrides?: Partial<HelloWeekendState>) {
    let state = { ...createInitialGameState(), ...stateOverrides }
    return {
        getState: vi.fn(() => state),
        getSessionId: vi.fn(() => "test-session-1"),
        getClientId: vi.fn(() => "client-1"),
        dispatch: vi.fn((reducerName: string, payload?: unknown) => {
            // Apply basic state mutations so subsequent reads see updated state
            if (reducerName === "SUBMIT_ANSWER" && payload) {
                const p = payload as { score: number }
                state = { ...state, score: p.score }
            }
        }),
        dispatchThunk: vi.fn().mockResolvedValue(undefined),
        logger: {
            info: vi.fn(),
            error: vi.fn(),
        },
    }
}

describe("START_GAME thunk integration", () => {
    let services: GameServices
    let mockTracking: ReturnType<typeof createMockTracking>
    let mockMetrics: ReturnType<typeof createMockMetrics>

    beforeEach(() => {
        vi.clearAllMocks()
        mockTracking = createMockTracking()
        mockMetrics = createMockMetrics()
        services = {
            serverState: new Map(),
            tracking: mockTracking as unknown as GameServices["tracking"],
            metrics: mockMetrics as unknown as GameServices["metrics"],
        }
    })

    it("calls trackGameStart with GAME_CONSTANTS.GAME_ID", async () => {
        const thunk = createStartGameThunk(services)
        const ctx = createMockCtx()

        await thunk(ctx, {})

        expect(mockTracking.trackGameStart).toHaveBeenCalledWith(
            "test-session-1",
            GAME_CONSTANTS.GAME_ID,
            "lobby",
            1,
        )
    })

    it("calls gaugeActiveSessions with GAME_CONSTANTS.GAME_ID", async () => {
        const thunk = createStartGameThunk(services)
        const ctx = createMockCtx()

        await thunk(ctx, {})

        expect(mockMetrics.gaugeActiveSessions).toHaveBeenCalledWith(
            GAME_CONSTANTS.GAME_ID,
            1,
        )
    })

    it("stores startedAt in serverState", async () => {
        const thunk = createStartGameThunk(services)
        const ctx = createMockCtx()
        const before = Date.now()

        await thunk(ctx, {})

        const serverState = services.serverState.get("test-session-1")
        expect(serverState).toBeDefined()
        expect(serverState!.startedAt).toBeGreaterThanOrEqual(before)
        expect(serverState!.startedAt).toBeLessThanOrEqual(Date.now())
    })
})

describe("PROCESS_TRANSCRIPTION thunk integration", () => {
    let services: GameServices
    let mockTracking: ReturnType<typeof createMockTracking>
    let mockMetrics: ReturnType<typeof createMockMetrics>

    function seedServerState(sessionId: string, overrides?: Partial<ServerOnlyState>) {
        services.serverState.set(sessionId, {
            questions: [
                { question: "Q1", answer: "blue", keywords: ["sky"] },
                { question: "Q2", answer: "four", keywords: ["4"] },
                { question: "Q3", answer: "paris", keywords: ["france"] },
                { question: "Q4", answer: "pacific", keywords: ["ocean"] },
                { question: "Q5", answer: "100", keywords: ["boiling"] },
            ],
            currentAnswer: "blue",
            currentKeywords: ["sky"],
            startedAt: Date.now() - 5000,
            ...overrides,
        })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockTracking = createMockTracking()
        mockMetrics = createMockMetrics()
        services = {
            serverState: new Map(),
            tracking: mockTracking as unknown as GameServices["tracking"],
            metrics: mockMetrics as unknown as GameServices["metrics"],
        }
    })

    it("calls trackQuestionAnswered with correct questionIndex and isCorrect=true", async () => {
        seedServerState("test-session-1")
        const thunk = createProcessTranscriptionThunk(services)
        const ctx = createMockCtx({ questionIndex: 0, totalQuestions: 5 })

        await thunk(ctx, { text: "I think it is blue" })

        expect(mockTracking.trackQuestionAnswered).toHaveBeenCalledWith(
            "test-session-1",
            0,
            true,
        )
    })

    it("calls trackQuestionAnswered with isCorrect=false for wrong answer", async () => {
        seedServerState("test-session-1")
        const thunk = createProcessTranscriptionThunk(services)
        const ctx = createMockCtx({ questionIndex: 0, totalQuestions: 5 })

        await thunk(ctx, { text: "I think it is red" })

        expect(mockTracking.trackQuestionAnswered).toHaveBeenCalledWith(
            "test-session-1",
            0,
            false,
        )
    })

    it("calls trackGameEnd with outcome completed_correct when last answer is correct", async () => {
        const startedAt = Date.now() - 10000
        seedServerState("test-session-1", {
            currentAnswer: "100",
            currentKeywords: ["boiling"],
            startedAt,
        })
        const thunk = createProcessTranscriptionThunk(services)
        // questionIndex=4 with totalQuestions=5 means this is the last question (nextIndex=5 >= 5)
        const ctx = createMockCtx({ questionIndex: 4, totalQuestions: 5 })

        await thunk(ctx, { text: "100 degrees" })

        expect(mockTracking.trackGameEnd).toHaveBeenCalledWith(
            "test-session-1",
            GAME_CONSTANTS.GAME_ID,
            expect.any(Number),
            5,
            "completed_correct",
        )
        // Duration should be approximately 10s
        const duration = mockTracking.trackGameEnd.mock.calls[0][2]
        expect(duration).toBeGreaterThanOrEqual(10000)
        expect(duration).toBeLessThan(12000)
    })

    it("calls trackGameEnd with outcome completed_incorrect when last answer is wrong", async () => {
        const startedAt = Date.now() - 8000
        seedServerState("test-session-1", {
            currentAnswer: "100",
            currentKeywords: ["boiling"],
            startedAt,
        })
        const thunk = createProcessTranscriptionThunk(services)
        const ctx = createMockCtx({ questionIndex: 4, totalQuestions: 5 })

        await thunk(ctx, { text: "wrong answer" })

        expect(mockTracking.trackGameEnd).toHaveBeenCalledWith(
            "test-session-1",
            GAME_CONSTANTS.GAME_ID,
            expect.any(Number),
            5,
            "completed_incorrect",
        )
    })

    it("calls gaugeActiveSessions(gameId, 0) on game over", async () => {
        seedServerState("test-session-1", {
            currentAnswer: "100",
            currentKeywords: ["boiling"],
        })
        const thunk = createProcessTranscriptionThunk(services)
        const ctx = createMockCtx({ questionIndex: 4, totalQuestions: 5 })

        await thunk(ctx, { text: "100" })

        expect(mockMetrics.gaugeActiveSessions).toHaveBeenCalledWith(
            GAME_CONSTANTS.GAME_ID,
            0,
        )
    })

    it("computes duration from startedAt in serverState", async () => {
        const startedAt = Date.now() - 7500
        seedServerState("test-session-1", {
            currentAnswer: "100",
            currentKeywords: ["boiling"],
            startedAt,
        })
        const thunk = createProcessTranscriptionThunk(services)
        const ctx = createMockCtx({ questionIndex: 4, totalQuestions: 5 })

        await thunk(ctx, { text: "100" })

        const duration = mockTracking.trackGameEnd.mock.calls[0][2]
        expect(duration).toBeGreaterThanOrEqual(7500)
        expect(duration).toBeLessThan(9000)
    })

    it("does not call trackGameEnd when not on the last question", async () => {
        seedServerState("test-session-1")
        const thunk = createProcessTranscriptionThunk(services)
        const ctx = createMockCtx({ questionIndex: 0, totalQuestions: 5 })

        await thunk(ctx, { text: "blue" })

        expect(mockTracking.trackGameEnd).not.toHaveBeenCalled()
        expect(mockMetrics.gaugeActiveSessions).not.toHaveBeenCalled()
    })
})
