import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createHash } from "node:crypto"

// Mock @segment/analytics-node
const mockTrack = vi.fn()
const mockCloseAndFlush = vi.fn().mockResolvedValue(undefined)

vi.mock("@segment/analytics-node", () => ({
    Analytics: vi.fn().mockImplementation(() => ({
        track: mockTrack,
        closeAndFlush: mockCloseAndFlush,
    })),
}))

import { TrackingService } from "./tracking"

function expectedMessageId(sessionId: string, event: string, index: string | number): string {
    return createHash("sha256")
        .update(`${sessionId}:${event}:${index}`)
        .digest("hex")
}

describe("TrackingService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("without SEGMENT_WRITE_KEY", () => {
        let service: TrackingService

        beforeEach(() => {
            delete process.env.SEGMENT_WRITE_KEY
            service = new TrackingService()
        })

        it("trackGameStart does not throw", () => {
            expect(() => service.trackGameStart("s1", "g1", "lobby", 1, 1)).not.toThrow()
        })

        it("trackGameEnd does not throw", () => {
            expect(() => service.trackGameEnd("s1", "g1", 5000, 3, "completed_correct", 1)).not.toThrow()
        })

        it("trackSessionStart does not throw", () => {
            expect(() => service.trackSessionStart("s1", "alexa", "voice")).not.toThrow()
        })

        it("trackSessionEnd does not throw", () => {
            expect(() => service.trackSessionEnd("s1", 10000)).not.toThrow()
        })

        it("trackPhaseTransition does not throw", () => {
            expect(() => service.trackPhaseTransition("s1", "g1", "lobby", "playing")).not.toThrow()
        })

        it("trackQuestionAnswered does not throw", () => {
            expect(() => service.trackQuestionAnswered("s1", 0, true)).not.toThrow()
        })

        it("trackCommandRequested does not throw", () => {
            expect(() => service.trackCommandRequested("s1", "start")).not.toThrow()
        })

        it("trackControllerConnected does not throw", () => {
            expect(() => service.trackControllerConnected("s1", "tv")).not.toThrow()
        })

        it("trackControllerDisconnected does not throw", () => {
            expect(() => service.trackControllerDisconnected("s1", "tv", "timeout")).not.toThrow()
        })

        it("flush does not throw", async () => {
            await expect(service.flush()).resolves.toBeUndefined()
        })

        it("does not call Analytics track", () => {
            service.trackGameStart("s1", "g1", "lobby", 1, 1)
            service.trackSessionStart("s1", "alexa", "voice")
            expect(mockTrack).not.toHaveBeenCalled()
        })
    })

    describe("with SEGMENT_WRITE_KEY", () => {
        let service: TrackingService

        beforeEach(() => {
            process.env.SEGMENT_WRITE_KEY = "test-key"
            service = new TrackingService()
        })

        afterEach(() => {
            delete process.env.SEGMENT_WRITE_KEY
        })

        // -- Correct event names ------------------------------------------

        it('trackGameStart sends "Game Instance Start"', () => {
            service.trackGameStart("s1", "hello-weekend", "lobby", 2, 1)
            expect(mockTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "Game Instance Start",
                    anonymousId: "s1",
                    properties: { gameId: "hello-weekend", phase: "lobby", playerCount: 2, gameInstance: 1 },
                }),
            )
        })

        it('trackGameEnd sends "Game Instance End"', () => {
            service.trackGameEnd("s1", "hello-weekend", 5000, 5, "completed_correct", 1)
            expect(mockTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "Game Instance End",
                    anonymousId: "s1",
                    properties: {
                        gameId: "hello-weekend",
                        duration: 5000,
                        phasesCompleted: 5,
                        outcome: "completed_correct",
                        gameInstance: 1,
                    },
                }),
            )
        })

        it('trackSessionStart sends "Session Start"', () => {
            service.trackSessionStart("s1", "alexa", "voice")
            expect(mockTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "Session Start",
                    properties: { platform: "alexa", eventSource: "voice" },
                }),
            )
        })

        it('trackSessionEnd sends "Session End"', () => {
            service.trackSessionEnd("s1", 10000)
            expect(mockTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "Session End",
                    properties: { duration: 10000 },
                }),
            )
        })

        it('trackPhaseTransition sends "Phase Transition"', () => {
            service.trackPhaseTransition("s1", "g1", "lobby", "playing")
            expect(mockTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "Phase Transition",
                    properties: { gameId: "g1", fromPhase: "lobby", toPhase: "playing" },
                }),
            )
        })

        it('trackQuestionAnswered sends "Question Answered"', () => {
            service.trackQuestionAnswered("s1", 3, true)
            expect(mockTrack).toHaveBeenCalledWith(
                expect.objectContaining({
                    event: "Question Answered",
                    properties: { questionIndex: 3, userCorrect: true },
                }),
            )
        })

        // -- Idempotent deduplication (SHA-256 messageId) -----------------

        it("produces deterministic messageId for same session+event+index", () => {
            service.trackGameStart("s1", "g1", "lobby", 1, 1)
            service.trackGameStart("s1", "g1", "lobby", 1, 1)

            const calls = mockTrack.mock.calls
            expect(calls).toHaveLength(2)
            expect(calls[0][0].messageId).toBe(calls[1][0].messageId)
            expect(calls[0][0].messageId).toBe(
                expectedMessageId("s1", "Game Instance Start", 1),
            )
        })

        it("produces different messageId for different sessions", () => {
            service.trackGameStart("s1", "g1", "lobby", 1, 1)
            service.trackGameStart("s2", "g1", "lobby", 1, 1)

            const [call1, call2] = mockTrack.mock.calls
            expect(call1[0].messageId).not.toBe(call2[0].messageId)
        })

        it("trackPhaseTransition uses fromPhase->toPhase as index", () => {
            service.trackPhaseTransition("s1", "g1", "lobby", "playing")
            const call = mockTrack.mock.calls[0][0]
            expect(call.messageId).toBe(
                expectedMessageId("s1", "Phase Transition", "lobby->playing"),
            )
        })

        it("trackQuestionAnswered uses questionIndex as index", () => {
            service.trackQuestionAnswered("s1", 2, false)
            const call = mockTrack.mock.calls[0][0]
            expect(call.messageId).toBe(
                expectedMessageId("s1", "Question Answered", 2),
            )
        })

        // -- Controller events have NO messageId -------------------------

        it("trackCommandRequested has no messageId", () => {
            service.trackCommandRequested("s1", "start")
            const call = mockTrack.mock.calls[0][0]
            expect(call.messageId).toBeUndefined()
            expect(call.event).toBe("Command Requested")
        })

        it("trackControllerConnected has no messageId", () => {
            service.trackControllerConnected("s1", "tv")
            const call = mockTrack.mock.calls[0][0]
            expect(call.messageId).toBeUndefined()
            expect(call.event).toBe("Controller Connected")
        })

        it("trackControllerDisconnected has no messageId", () => {
            service.trackControllerDisconnected("s1", "tv", "timeout")
            const call = mockTrack.mock.calls[0][0]
            expect(call.messageId).toBeUndefined()
            expect(call.event).toBe("Controller Disconnected")
        })

        // -- flush --------------------------------------------------------

        it("flush calls closeAndFlush on analytics instance", async () => {
            await service.flush()
            expect(mockCloseAndFlush).toHaveBeenCalledOnce()
        })
    })
})
