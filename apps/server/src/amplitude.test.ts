import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@amplitude/analytics-node", () => ({
    init: vi.fn(),
    track: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
}))

// Import after mock setup
import * as amplitudeSdk from "@amplitude/analytics-node"
import { init, track, flush } from "./amplitude"

describe("amplitude", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("without AMPLITUDE_API_KEY", () => {
        beforeEach(() => {
            delete process.env.AMPLITUDE_API_KEY
        })

        it("init does not call amplitude.init", () => {
            init()
            expect(amplitudeSdk.init).not.toHaveBeenCalled()
        })

        it("track does not call amplitude.track when not initialised", () => {
            track("Test Event", { foo: "bar" })
            expect(amplitudeSdk.track).not.toHaveBeenCalled()
        })

        it("flush resolves without calling amplitude.flush when not initialised", async () => {
            await expect(flush()).resolves.toBeUndefined()
            expect(amplitudeSdk.flush).not.toHaveBeenCalled()
        })
    })

    describe("with AMPLITUDE_API_KEY", () => {
        beforeEach(() => {
            process.env.AMPLITUDE_API_KEY = "test-amp-key"
        })

        afterEach(() => {
            delete process.env.AMPLITUDE_API_KEY
        })

        it("init calls amplitude.init with the API key", () => {
            init()
            expect(amplitudeSdk.init).toHaveBeenCalledWith("test-amp-key")
        })

        it("track forwards events after init", () => {
            init()
            track("Game Started", { gameId: "hello-weekend" })
            expect(amplitudeSdk.track).toHaveBeenCalledWith("Game Started", {
                gameId: "hello-weekend",
            })
        })

        it("flush awaits amplitude.flush after init", async () => {
            init()
            await flush()
            expect(amplitudeSdk.flush).toHaveBeenCalledOnce()
        })
    })
})
