import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as amplitude from "@amplitude/analytics-browser"
import {
    initTracking,
    trackScreenDisplayed,
    trackButtonPressed,
    trackGameSessionStart,
    trackControllerPaired,
} from "./tracking"

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

        trackScreenDisplayed("lobby", "waiting", "game-1")
        expect(amplitude.track).not.toHaveBeenCalled()
    })

    it("calls amplitude.init with the API key", () => {
        vi.stubEnv("VITE_AMPLITUDE_API_KEY", "amp-key-123")

        initTracking()

        expect(amplitude.init).toHaveBeenCalledWith("amp-key-123", {
            defaultTracking: false,
        })
    })
})

describe("track functions", () => {
    beforeEach(() => {
        vi.stubEnv("VITE_AMPLITUDE_API_KEY", "amp-key-123")
        initTracking()
        vi.mocked(amplitude.track).mockClear()
    })

    it("trackScreenDisplayed fires 'Screen Displayed' with correct properties", () => {
        trackScreenDisplayed("lobby", "waiting", "game-42")

        expect(amplitude.track).toHaveBeenCalledWith("Screen Displayed", {
            scene: "lobby",
            phase: "waiting",
            gameId: "game-42",
        })
    })

    it("trackButtonPressed fires 'Button Pressed' with correct properties", () => {
        trackButtonPressed("submit-btn", "answering", "optionA")

        expect(amplitude.track).toHaveBeenCalledWith("Button Pressed", {
            buttonId: "submit-btn",
            phase: "answering",
            choiceValue: "optionA",
        })
    })

    it("trackGameSessionStart fires 'Game Session Start' with correct properties", () => {
        trackGameSessionStart("sess-1", "display")

        expect(amplitude.track).toHaveBeenCalledWith("Game Session Start", {
            sessionId: "sess-1",
            clientType: "display",
        })
    })

    it("trackControllerPaired fires 'Controller Paired' with correct properties", () => {
        trackControllerPaired("sess-1", "controller")

        expect(amplitude.track).toHaveBeenCalledWith("Controller Paired", {
            sessionId: "sess-1",
            clientType: "controller",
        })
    })
})
