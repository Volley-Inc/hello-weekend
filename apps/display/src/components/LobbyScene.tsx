import type { HelloWeekendState } from "@hello-weekend/shared"
import { useSessionMembers } from "../hooks/useVGFState"

interface LobbySceneProps {
    state: HelloWeekendState
}

export function LobbyScene({ state }: LobbySceneProps) {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get("sessionId") ?? ""
    const controllerPort = import.meta.env.DEV ? "5174" : window.location.port
    const controllerUrl = `${window.location.protocol}//${window.location.hostname}:${controllerPort}?sessionId=${sessionId}`

    const members = useSessionMembers()
    const controllers = Object.entries(members)
        .filter(([, m]) => m.clientType === "CONTROLLER")
    const playerCount = controllers.length

    return (
        <div data-phase="lobby" style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            backgroundColor: "#1a1a2e",
            color: "#e0e0e0",
            fontFamily: "sans-serif",
            gap: "2rem",
        }}>
            <h1 style={{
                fontSize: "4rem",
                margin: 0,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
            }}>
                Hello Weekend!
            </h1>

            <p style={{
                fontSize: "1.5rem",
                color: "#aaa",
                margin: 0,
            }}>
                Waiting for a controller to connect...
            </p>

            <div style={{
                padding: "1.5rem 2rem",
                backgroundColor: "#16213e",
                borderRadius: "12px",
                border: "1px solid #333",
                textAlign: "center",
            }}>
                <p style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#888" }}>
                    Connect your controller at:
                </p>
                <a
                    href={controllerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: "block",
                        margin: 0,
                        fontSize: "1.2rem",
                        color: "#667eea",
                        fontFamily: "monospace",
                        wordBreak: "break-all",
                    }}
                >
                    {controllerUrl}
                </a>
            </div>

            {/* Connected players */}
            <div style={{
                padding: "1.5rem 2rem",
                backgroundColor: "#16213e",
                borderRadius: "12px",
                border: "1px solid #333",
                textAlign: "center",
                minWidth: "280px",
            }}>
                <p data-player-count={playerCount} style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "1.2rem",
                    color: "#667eea",
                    fontWeight: "bold",
                }}>
                    {playerCount} {playerCount === 1 ? "player" : "players"} connected
                </p>
                {controllers.length > 0 && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                    }}>
                        {controllers.map(([id]) => (
                            <div key={id} style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#1a1a2e",
                                borderRadius: "8px",
                                fontSize: "1rem",
                                color: "#aaa",
                                fontFamily: "monospace",
                            }}>
                                {id}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
