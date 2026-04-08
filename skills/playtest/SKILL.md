# /playtest

Structured playtesting checklist to verify a game works end-to-end before deployment.

## Usage

```
/playtest              # Run the full checklist
/playtest [area]       # Focus on a specific area (display, controller, flow, compat)
```

## Instructions

When the user invokes this skill:

### 1. Pre-flight

Before testing, verify the basics:

```bash
pnpm build     # Must pass — don't test a broken build
pnpm test      # Unit tests must pass
pnpm dev       # Start dev servers
```

If any of these fail, fix them first. Don't proceed with playtesting on broken code.

### 2. Run the Checklist

Work through each section. For each item, actually verify it — open the URL, click the button, check the screen. Don't assume it works. Mark each item PASS, FAIL, or SKIP (with reason).

#### A. Display — TV Screen (http://localhost:3000)

| # | Check | How to Verify |
|---|-------|---------------|
| D1 | Display loads without errors | Open http://localhost:3000, check browser console for errors |
| D2 | Lobby screen renders | Should see game title, waiting message, QR code/join info |
| D3 | Player count updates | Connect a controller, verify count increments on display |
| D4 | Phase transitions animate | Start game, watch for smooth transition from lobby → playing |
| D5 | Game content renders | Questions/prompts/game elements visible and readable |
| D6 | Score updates in real-time | Submit an answer, verify score changes on display |
| D7 | Game over screen shows results | Play through to end, verify final score/rankings display |
| D8 | Text is readable at TV distance | All text should be legible from 3 metres away (minimum 24px) |
| D9 | No overflow or clipping | Check all screens for text/elements cut off at edges |
| D10 | Animations don't stutter | Watch transitions and effects — should be 60fps smooth |

#### B. Controller — Phone (http://localhost:5174)

| # | Check | How to Verify |
|---|-------|---------------|
| C1 | Controller loads with sessionId | Open controller URL with `?sessionId=dev-test`, check it connects |
| C2 | Lobby shows connected state | Should confirm connection, show "Start Game" or waiting state |
| C3 | Start Game works | Tap Start Game, verify display transitions to playing |
| C4 | Primary input works | Test the main interaction (tap, swipe, type, voice) |
| C5 | Input feedback is immediate | After input, visual/haptic feedback within 200ms |
| C6 | Score/progress visible | Player can see their own score or progress |
| C7 | Game over shows results | Final screen with score and Play Again option |
| C8 | Play Again works | Tap Play Again, verify return to lobby, start new game |
| C9 | Touch targets are 44px+ | All buttons and interactive elements are finger-friendly |
| C10 | Works in portrait AND landscape | Rotate phone, verify layout doesn't break |

#### C. Full Game Flow

| # | Check | How to Verify |
|---|-------|---------------|
| F1 | Fresh session flow | Kill servers, restart, open display + controller from scratch |
| F2 | Multi-controller | Connect 2+ controllers, verify all can interact |
| F3 | Complete game loop | Play from lobby → game → game over → play again → game → game over |
| F4 | State resets on Play Again | Score, progress, content should reset for new game |
| F5 | No stale state between rounds | After Play Again, no leftover data from previous game |
| F6 | Content variety | Play 3 games in a row — content should differ each time |

#### D. Compatibility & Edge Cases

| # | Check | How to Verify |
|---|-------|---------------|
| E1 | Chrome 68 syntax check | Run `pnpm build` with `target: "chrome68"` — no build errors |
| E2 | No optional chaining in display | Search display code for `?.` — must be polyfilled or avoided |
| E3 | Controller disconnect recovery | Close controller tab, reopen — does it reconnect? |
| E4 | Rapid input handling | Tap/submit rapidly 10 times — no crashes, dupes, or freezes |
| E5 | Empty state guard | Check SceneRouter and PhaseRouter handle `{}` state gracefully |
| E6 | No console errors | Check browser console on both display and controller — should be clean (DispatchTimeoutError is expected and suppressed) |
| E7 | Back button (display) | Press Backspace on display page — should post "close" to parent |

### 3. Produce the Report

After completing the checklist, output a summary:

```
## Playtest Report

**Date:** [date]
**Game:** [game name]
**Tested by:** AI agent

### Results
- Display: [X/10 passed]
- Controller: [X/10 passed]  
- Game Flow: [X/6 passed]
- Compatibility: [X/7 passed]
- **Overall: [total]/33 passed**

### Failures
1. [D5] FAIL — [description of what went wrong]
2. [C4] FAIL — [description]

### Recommendations
- [Priority 1 fix]
- [Priority 2 fix]
- [Nice to have]
```

### 4. Fix Failures

If any items fail:
1. Prioritise by impact: game-breaking > confusing UX > cosmetic
2. Fix the highest-priority failure
3. Re-run the affected checklist items
4. Repeat until all items pass or remaining failures are documented as known issues

## When to Use

- After `/build-game` completes — always playtest before deploying
- After any significant game logic change
- Before running `crucible publish`
- When the user says "test it" or "does it work?"
