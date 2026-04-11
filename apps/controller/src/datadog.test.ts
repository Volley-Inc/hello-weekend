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
    it("does not call init when env vars are missing", () => {
        initDatadog()

        expect(datadogRum.init).not.toHaveBeenCalled()
        expect(datadogLogs.init).not.toHaveBeenCalled()
    })

    it("calls init when both env vars are present", () => {
        vi.stubEnv("VITE_DD_APPLICATION_ID", "app-123")
        vi.stubEnv("VITE_DD_CLIENT_TOKEN", "tok-456")
        vi.stubEnv("VITE_DD_SERVICE", "hello-weekend-controller")
        vi.stubEnv("VITE_DD_ENV", "dev")

        initDatadog()

        expect(datadogRum.init).toHaveBeenCalledWith(
            expect.objectContaining({
                applicationId: "app-123",
                clientToken: "tok-456",
                site: "datadoghq.com",
            }),
        )
        expect(datadogLogs.init).toHaveBeenCalledWith(
            expect.objectContaining({
                clientToken: "tok-456",
                site: "datadoghq.com",
            }),
        )
    })
})
