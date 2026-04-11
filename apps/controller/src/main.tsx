/**
 * Controller app entry point.
 *
 * CRITICAL: DispatchTimeoutError suppression — WGFServer does not send
 * Socket.IO acknowledgements for thunk dispatches that trigger phase
 * transitions. The client-side dispatchThunk() rejects with
 * DispatchTimeoutError after 10s. This is expected behaviour.
 *
 * CRITICAL: NO StrictMode — React 18/19 StrictMode double mount/unmount
 * permanently kills the VGF Socket.IO transport.
 */
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { initDatadog } from "./datadog"
import { initTracking, trackGameSessionStart } from "./tracking"
import { getSessionIdFromUrl } from "./utils/params"

initDatadog()
initTracking()

// Track controller session start (once per page load)
const controllerSessionId = getSessionIdFromUrl() ?? ""
if (controllerSessionId) trackGameSessionStart(controllerSessionId, "controller")

// Suppress DispatchTimeoutError from unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
    if (
        event.reason?.name === "DispatchTimeoutError" ||
        event.reason?.message?.includes?.("DispatchTimeoutError") ||
        event.reason?.message?.includes?.("Dispatch timed out")
    ) {
        event.preventDefault()
        console.warn("[VGF] DispatchTimeoutError suppressed (expected for phase transitions)")
    }
})

createRoot(document.getElementById("root")!).render(<App />)
