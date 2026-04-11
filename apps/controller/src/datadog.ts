import { datadogRum } from "@datadog/browser-rum"
import { datadogLogs } from "@datadog/browser-logs"

export function initDatadog() {
    const applicationId = import.meta.env.VITE_DD_APPLICATION_ID
    const clientToken = import.meta.env.VITE_DD_CLIENT_TOKEN
    const service = import.meta.env.VITE_DD_SERVICE
    const env = import.meta.env.VITE_DD_ENV ?? "dev"

    // Gracefully no-op if not configured
    if (!applicationId || !clientToken) return

    datadogRum.init({
        applicationId,
        clientToken,
        site: "datadoghq.com",
        service,
        env,
        sessionSampleRate: env === "prod" ? 5 : 100,
        sessionReplaySampleRate: env === "prod" ? 5 : 100,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: "mask",
    })

    datadogLogs.init({
        clientToken,
        site: "datadoghq.com",
        service,
        env,
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
    })
}
