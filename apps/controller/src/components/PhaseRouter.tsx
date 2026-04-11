/**
 * Routes to the correct controller component based on the current game phase.
 *
 * CRITICAL: VGF state starts as {} — always guard with "phase" in state
 * before rendering phase-specific components.
 */
import { useEffect, useRef } from "react"
import { useStateSync } from "../hooks/useVGFState"
import { getSessionIdFromUrl } from "../utils/params"
import { LobbyController } from "./LobbyController"
import { PlayingController } from "./PlayingController"
import { GameOverController } from "./GameOverController"
import { GAME_CONSTANTS } from "@hello-weekend/shared"
import { trackControllerPaired, trackScreenDisplayed } from "../tracking"

export function PhaseRouter() {
    const state = useStateSync()
    const pairedRef = useRef(false)
    const prevPhaseRef = useRef<string | null>(null)

    // Track controller paired on first state sync, and screen changes on phase transitions
    useEffect(() => {
        if (!state || !("phase" in state)) return

        if (!pairedRef.current) {
            pairedRef.current = true
            const sessionId = getSessionIdFromUrl()
            if (sessionId) trackControllerPaired(sessionId, "controller")
        }

        if (state.phase !== prevPhaseRef.current) {
            prevPhaseRef.current = state.phase
            trackScreenDisplayed(state.phase, state.phase, GAME_CONSTANTS.GAME_ID)
        }
    }, [state])

    if (!state || !("phase" in state)) {
        return (
            <div style={{ padding: 32, fontFamily: "sans-serif", textAlign: "center" }}>
                <p>Connecting...</p>
            </div>
        )
    }

    switch (state.phase) {
        case "lobby":
            return <LobbyController />
        case "playing":
            return <PlayingController />
        case "gameOver":
            return <GameOverController />
        default:
            return (
                <div style={{ padding: 32, fontFamily: "sans-serif", textAlign: "center" }}>
                    <p>Unknown phase: {state.phase}</p>
                </div>
            )
    }
}
