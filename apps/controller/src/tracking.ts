import * as amplitude from "@amplitude/analytics-browser"

let initialized = false

export function initTracking() {
    const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY
    if (!apiKey) return
    amplitude.init(apiKey, { defaultTracking: false })
    initialized = true
}

export function trackScreenDisplayed(scene: string, phase: string, gameId: string) {
    if (!initialized) return
    amplitude.track("Screen Displayed", { scene, phase, gameId })
}

export function trackButtonPressed(buttonId: string, phase: string, choiceValue?: string) {
    if (!initialized) return
    amplitude.track("Button Pressed", { buttonId, phase, choiceValue })
}

export function trackGameSessionStart(sessionId: string, clientType: string) {
    if (!initialized) return
    amplitude.track("Game Session Start", { sessionId, clientType })
}

export function trackControllerPaired(sessionId: string, clientType: string) {
    if (!initialized) return
    amplitude.track("Controller Paired", { sessionId, clientType })
}
