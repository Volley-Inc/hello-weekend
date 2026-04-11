import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock hot-shots
const mockGauge = vi.fn()
const mockHistogram = vi.fn()
const mockClose = vi.fn()

vi.mock("hot-shots", () => ({
    default: vi.fn().mockImplementation(() => ({
        gauge: mockGauge,
        histogram: mockHistogram,
        close: mockClose,
    })),
}))

import { MetricsService } from "./metrics"

describe("MetricsService", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("without DD_AGENT_HOST", () => {
        let service: MetricsService

        beforeEach(() => {
            delete process.env.DD_AGENT_HOST
            service = new MetricsService()
        })

        it("gaugeActiveSessions does not throw", () => {
            expect(() => service.gaugeActiveSessions("g1", 5)).not.toThrow()
        })

        it("gaugeConnectedClients does not throw", () => {
            expect(() => service.gaugeConnectedClients("g1", "tv", 2)).not.toThrow()
        })

        it("histogramThunkDuration does not throw", () => {
            expect(() => service.histogramThunkDuration("g1", "START_GAME", 42)).not.toThrow()
        })

        it("close does not throw", () => {
            expect(() => service.close()).not.toThrow()
        })

        it("does not call StatsD methods", () => {
            service.gaugeActiveSessions("g1", 1)
            service.gaugeConnectedClients("g1", "tv", 1)
            service.histogramThunkDuration("g1", "START_GAME", 10)
            expect(mockGauge).not.toHaveBeenCalled()
            expect(mockHistogram).not.toHaveBeenCalled()
        })
    })

    describe("with DD_AGENT_HOST", () => {
        let service: MetricsService

        beforeEach(() => {
            process.env.DD_AGENT_HOST = "localhost"
            service = new MetricsService()
        })

        afterEach(() => {
            delete process.env.DD_AGENT_HOST
        })

        it("gaugeActiveSessions calls gauge with correct metric and tags", () => {
            service.gaugeActiveSessions("hello-weekend", 3)
            expect(mockGauge).toHaveBeenCalledWith("active_sessions", 3, {
                game_id: "hello-weekend",
            })
        })

        it("gaugeConnectedClients calls gauge with game_id and client_type tags", () => {
            service.gaugeConnectedClients("hello-weekend", "controller", 2)
            expect(mockGauge).toHaveBeenCalledWith("connected_clients", 2, {
                game_id: "hello-weekend",
                client_type: "controller",
            })
        })

        it("histogramThunkDuration calls histogram with game_id and thunk tags", () => {
            service.histogramThunkDuration("hello-weekend", "START_GAME", 150)
            expect(mockHistogram).toHaveBeenCalledWith("thunk_duration", 150, {
                game_id: "hello-weekend",
                thunk: "START_GAME",
            })
        })

        it("constructs StatsD with crucible. prefix", async () => {
            // The StatsD constructor is called with prefix "crucible."
            const { default: StatsD } = await import("hot-shots")
            expect(vi.mocked(StatsD)).toHaveBeenCalledWith(
                expect.objectContaining({ prefix: "crucible." }),
            )
        })

        it("close calls StatsD close", () => {
            service.close()
            expect(mockClose).toHaveBeenCalledOnce()
        })
    })
})
