import { createRoot } from "react-dom/client"
import { App } from "./App"
import { initDatadog } from "./datadog"
import { initTracking, trackGameSessionStart } from "./tracking"

initDatadog()
initTracking()

// Track display session start (once per page load)
const displaySessionId = new URLSearchParams(window.location.search).get("sessionId") ?? ""
if (displaySessionId) trackGameSessionStart(displaySessionId, "display")

// Signal VWR that this iframe is ready. Must fire early and unconditionally —
// PlatformProvider's built-in ready event may never fire if auth fails (401 on
// Fire TV). VWR ignores duplicate ready events so this is safe.
// See: BUILDING_TV_GAMES.md § "VWR Ready Signal"
if (window.parent && window.parent !== window) {
    window.parent.postMessage(
        { type: "ready", source: "platform-sdk-iframe", args: [] },
        "*"
    )
}

// Suppress DispatchTimeoutError — WGFServer does not send Socket.IO acks,
// so dispatchThunk/dispatchReducer always reject after 10s. The thunk DOES execute.
window.addEventListener("unhandledrejection", (e) => {
    if (e.reason?.name === "DispatchTimeoutError") e.preventDefault()
})

// NO StrictMode — it kills VGF's Socket.IO transport
createRoot(document.getElementById("root")!).render(<App />)
