import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as amplitude from "@amplitude/analytics-browser"
import { initTracking, trackControllerPaired } from "./tracking"

vi.mock("@amplitude/analytics-browser", () => ({
    init: vi.fn(),
    track: vi.fn(),
}))

beforeEach(() => {
    vi.mocked(amplitude.init).mockClear()
    vi.mocked(amplitude.track).mockClear()
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("initTracking", () => {
    it("does not init amplitude when VITE_AMPLITUDE_API_KEY is missing", () => {
        initTracking()

        expect(amplitude.init).not.toHaveBeenCalled()
    })
})

describe("trackControllerPaired", () => {
    it("fires 'Controller Paired' with correct properties", () => {
        vi.stubEnv("VITE_AMPLITUDE_API_KEY", "amp-key-123")

        initTracking()
        vi.mocked(amplitude.track).mockClear()

        trackControllerPaired("sess-1", "controller")

        expect(amplitude.track).toHaveBeenCalledWith("Controller Paired", {
            sessionId: "sess-1",
            clientType: "controller",
        })
    })
})
