import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { datadogRum } from "@datadog/browser-rum"
import { datadogLogs } from "@datadog/browser-logs"
import { initDatadog } from "./datadog"

vi.mock("@datadog/browser-rum", () => ({
    datadogRum: {
        init: vi.fn(),
    },
}))

vi.mock("@datadog/browser-logs", () => ({
    datadogLogs: {
        init: vi.fn(),
    },
}))

beforeEach(() => {
    vi.mocked(datadogRum.init).mockClear()
    vi.mocked(datadogLogs.init).mockClear()
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("initDatadog", () => {
    it("does not call init when VITE_DD_APPLICATION_ID is missing", () => {
        vi.stubEnv("VITE_DD_CLIENT_TOKEN", "tok-123")

        initDatadog()

        expect(datadogRum.init).not.toHaveBeenCalled()
        expect(datadogLogs.init).not.toHaveBeenCalled()
    })

    it("does not call init when VITE_DD_CLIENT_TOKEN is missing", () => {
        vi.stubEnv("VITE_DD_APPLICATION_ID", "app-123")

        initDatadog()

        expect(datadogRum.init).not.toHaveBeenCalled()
        expect(datadogLogs.init).not.toHaveBeenCalled()
    })

    it("calls datadogRum.init and datadogLogs.init with correct config", () => {
        vi.stubEnv("VITE_DD_APPLICATION_ID", "app-123")
        vi.stubEnv("VITE_DD_CLIENT_TOKEN", "tok-456")
        vi.stubEnv("VITE_DD_SERVICE", "hello-weekend")
        vi.stubEnv("VITE_DD_ENV", "staging")

        initDatadog()

        expect(datadogRum.init).toHaveBeenCalledWith(
            expect.objectContaining({
                applicationId: "app-123",
                clientToken: "tok-456",
                site: "datadoghq.com",
                service: "hello-weekend",
                env: "staging",
            }),
        )

        expect(datadogLogs.init).toHaveBeenCalledWith(
            expect.objectContaining({
                clientToken: "tok-456",
                site: "datadoghq.com",
                service: "hello-weekend",
                env: "staging",
                forwardErrorsToLogs: true,
            }),
        )
    })

    it("sets sessionSampleRate to 5 when env is prod", () => {
        vi.stubEnv("VITE_DD_APPLICATION_ID", "app-123")
        vi.stubEnv("VITE_DD_CLIENT_TOKEN", "tok-456")
        vi.stubEnv("VITE_DD_ENV", "prod")

        initDatadog()

        expect(datadogRum.init).toHaveBeenCalledWith(
            expect.objectContaining({
                sessionSampleRate: 5,
            }),
        )
    })

    it("sets sessionSampleRate to 100 when env is not prod", () => {
        vi.stubEnv("VITE_DD_APPLICATION_ID", "app-123")
        vi.stubEnv("VITE_DD_CLIENT_TOKEN", "tok-456")
        vi.stubEnv("VITE_DD_ENV", "dev")

        initDatadog()

        expect(datadogRum.init).toHaveBeenCalledWith(
            expect.objectContaining({
                sessionSampleRate: 100,
            }),
        )
    })

    it("sets defaultPrivacyLevel to mask", () => {
        vi.stubEnv("VITE_DD_APPLICATION_ID", "app-123")
        vi.stubEnv("VITE_DD_CLIENT_TOKEN", "tok-456")

        initDatadog()

        expect(datadogRum.init).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultPrivacyLevel: "mask",
            }),
        )
    })
})
