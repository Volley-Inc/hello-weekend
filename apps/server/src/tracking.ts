/**
 * Segment analytics wrapper with idempotent deduplication.
 *
 * VGF thunks can replay on reconnect — the SHA-256 messageId ensures
 * Segment deduplicates events that fire more than once for the same
 * session + event + index combination.
 *
 * No-ops when SEGMENT_WRITE_KEY is unset (local dev).
 */
import { createHash } from "node:crypto"
import { Analytics } from "@segment/analytics-node"

function makeMessageId(sessionId: string, eventName: string, index: string | number): string {
    return createHash("sha256")
        .update(`${sessionId}:${eventName}:${index}`)
        .digest("hex")
}

export class TrackingService {
    private analytics: Analytics | null
    private gameInstanceCounter = 0

    constructor() {
        const writeKey = process.env.SEGMENT_WRITE_KEY
        this.analytics = writeKey ? new Analytics({ writeKey }) : null
    }

    /** Increment and return a per-instance game counter for dedup keys. */
    nextGameInstance(): number {
        return ++this.gameInstanceCounter
    }

    // -- Game lifecycle ------------------------------------------------

    trackGameStart(
        sessionId: string,
        gameId: string,
        phase: string,
        playerCount: number,
        gameInstance: number,
    ): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Game Instance Start",
            properties: { gameId, phase, playerCount, gameInstance },
            messageId: makeMessageId(sessionId, "Game Instance Start", gameInstance),
        })
    }

    trackGameEnd(
        sessionId: string,
        gameId: string,
        duration: number,
        phasesCompleted: number,
        outcome: string,
        gameInstance: number,
    ): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Game Instance End",
            properties: { gameId, duration, phasesCompleted, outcome, gameInstance },
            messageId: makeMessageId(sessionId, "Game Instance End", gameInstance),
        })
    }

    // -- Session lifecycle ---------------------------------------------

    trackSessionStart(
        sessionId: string,
        platform: string,
        eventSource: string,
    ): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Session Start",
            properties: { platform, eventSource },
            messageId: makeMessageId(sessionId, "Session Start", "0"),
        })
    }

    trackSessionEnd(sessionId: string, duration: number): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Session End",
            properties: { duration },
            messageId: makeMessageId(sessionId, "Session End", "0"),
        })
    }

    // -- Phase transitions ---------------------------------------------

    trackPhaseTransition(
        sessionId: string,
        gameId: string,
        fromPhase: string,
        toPhase: string,
    ): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Phase Transition",
            properties: { gameId, fromPhase, toPhase },
            messageId: makeMessageId(sessionId, "Phase Transition", `${fromPhase}->${toPhase}`),
        })
    }

    // -- Gameplay ------------------------------------------------------

    trackQuestionAnswered(
        sessionId: string,
        questionIndex: number,
        userCorrect: boolean,
    ): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Question Answered",
            properties: { questionIndex, userCorrect },
            messageId: makeMessageId(sessionId, "Question Answered", questionIndex),
        })
    }

    // -- Controller events (no idempotency — fire-and-forget) ----------

    trackCommandRequested(sessionId: string, commandName: string): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Command Requested",
            properties: { commandName },
        })
    }

    trackControllerConnected(sessionId: string, clientType: string): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Controller Connected",
            properties: { clientType },
        })
    }

    trackControllerDisconnected(
        sessionId: string,
        clientType: string,
        reason: string,
    ): void {
        this.analytics?.track({
            anonymousId: sessionId,
            event: "Controller Disconnected",
            properties: { clientType, reason },
        })
    }

    // -- Lifecycle ------------------------------------------------------

    async flush(): Promise<void> {
        await this.analytics?.closeAndFlush()
    }
}
