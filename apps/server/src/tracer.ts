/**
 * Datadog APM tracer initialisation.
 *
 * MUST be imported before any other module in the app entry point
 * so dd-trace can monkey-patch HTTP/gRPC/etc.
 *
 * No-ops when DD_ENV and DD_AGENT_HOST are both unset (local dev).
 */

const ddEnabled = !!(process.env.DD_ENV || process.env.DD_AGENT_HOST)

if (ddEnabled) {
    // Dynamic import keeps dd-trace out of the bundle when disabled.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const tracer = require("dd-trace")
    tracer.init({
        service: process.env.DD_SERVICE ?? "hello-weekend",
        logInjection: true,
    })
}

export { ddEnabled }
