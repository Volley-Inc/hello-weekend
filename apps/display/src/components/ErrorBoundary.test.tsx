import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement } from "react"
import { datadogRum } from "@datadog/browser-rum"
import { ErrorBoundary } from "./ErrorBoundary"

vi.mock("@datadog/browser-rum", () => ({
    datadogRum: {
        init: vi.fn(),
        addError: vi.fn(),
    },
}))

beforeEach(() => {
    vi.mocked(datadogRum.addError).mockClear()
})

describe("ErrorBoundary", () => {
    it("getDerivedStateFromError returns hasError true", () => {
        const state = ErrorBoundary.getDerivedStateFromError()
        expect(state).toEqual({ hasError: true })
    })

    it("componentDidCatch reports error to datadogRum", () => {
        const instance = new ErrorBoundary({ children: null })
        const error = new Error("test crash")
        const info = { componentStack: "\n    in BrokenComponent" } as React.ErrorInfo

        instance.componentDidCatch(error, info)

        expect(datadogRum.addError).toHaveBeenCalledWith(error, {
            componentStack: "\n    in BrokenComponent",
        })
    })

    it("renders children when there is no error", () => {
        const instance = new ErrorBoundary({
            children: createElement("span", null, "Hello"),
        })
        instance.state = { hasError: false }

        const result = instance.render()
        expect(result).toEqual(createElement("span", null, "Hello"))
    })

    it("renders default fallback when hasError is true", () => {
        const instance = new ErrorBoundary({
            children: createElement("span", null, "Hello"),
        })
        instance.state = { hasError: true }

        const result = instance.render()
        expect(result).toEqual(createElement("div", null, "Something went wrong"))
    })

    it("renders custom fallback when provided and hasError is true", () => {
        const customFallback = createElement("p", null, "Custom error")
        const instance = new ErrorBoundary({
            children: createElement("span", null, "Hello"),
            fallback: customFallback,
        })
        instance.state = { hasError: true }

        const result = instance.render()
        expect(result).toEqual(customFallback)
    })
})
