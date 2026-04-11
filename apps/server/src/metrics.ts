/**
 * StatsD client for KEDA scaling gauges and thunk performance histograms.
 *
 * Uses hot-shots (Datadog-flavoured StatsD).
 * No-ops when DD_AGENT_HOST is unset (local dev).
 */
import StatsD from "hot-shots"

type StatsDClient = InstanceType<typeof StatsD>

export class MetricsService {
    private client: StatsDClient | null

    constructor() {
        const host = process.env.DD_AGENT_HOST
        this.client = host
            ? new StatsD({
                  host,
                  port: parseInt(process.env.DD_DOGSTATSD_PORT ?? "8125", 10),
                  prefix: "crucible.",
                  globalTags: {
                      service: process.env.DD_SERVICE ?? "hello-weekend",
                      env: process.env.DD_ENV ?? "unknown",
                  },
              })
            : null
    }

    gaugeActiveSessions(gameId: string, count: number): void {
        this.client?.gauge("active_sessions", count, { game_id: gameId })
    }

    gaugeConnectedClients(
        gameId: string,
        clientType: string,
        count: number,
    ): void {
        this.client?.gauge("connected_clients", count, {
            game_id: gameId,
            client_type: clientType,
        })
    }

    histogramThunkDuration(
        gameId: string,
        thunkName: string,
        durationMs: number,
    ): void {
        this.client?.histogram("thunk_duration", durationMs, {
            game_id: gameId,
            thunk: thunkName,
        })
    }

    close(): void {
        this.client?.close()
    }
}
