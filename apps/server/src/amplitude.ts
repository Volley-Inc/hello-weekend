/**
 * Amplitude Node SDK wrapper (optional for Phase 1).
 *
 * Segment already forwards events to Amplitude, but this allows
 * direct server-side tracking when needed.
 *
 * No-ops when AMPLITUDE_API_KEY is unset (local dev).
 */
import * as amplitude from "@amplitude/analytics-node"

let initialised = false

export function init(): void {
    const apiKey = process.env.AMPLITUDE_API_KEY
    if (!apiKey) return
    amplitude.init(apiKey)
    initialised = true
}

export function track(
    eventName: string,
    properties: Record<string, unknown>,
): void {
    if (!initialised) return
    amplitude.track(eventName, properties)
}

export async function flush(): Promise<void> {
    if (!initialised) return
    await amplitude.flush()
}
