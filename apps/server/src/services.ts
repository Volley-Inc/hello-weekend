import type { ServerOnlyState } from "@hello-weekend/shared"
import type { TrackingService } from "./tracking"
import type { MetricsService } from "./metrics"

export interface GameServices {
    serverState: Map<string, ServerOnlyState>
    tracking: TrackingService
    metrics: MetricsService
}
