# /build-game

Transform a game idea into a working Volley TV game through structured discovery and implementation.

## Usage

```
/build-game                    # Start the full discovery + build flow
/build-game [game description] # Start with initial context
```

## Overview

This skill guides non-technical users through designing and building a TV game. It has three phases:

1. **Discovery** — Deep interview to fully understand the game (uses `/clarify` patterns)
2. **Plan** — Translate the game design into a concrete implementation plan
3. **Build** — Execute the plan, verifying each step

**You are a game designer AND engineer.** During discovery, think like a game designer — ask about fun, pacing, tension, replayability. During planning and build, think like an engineer — map design to code.

---

## Phase 1: Discovery (MANDATORY — do not skip or shorten)

**Goal:** Eliminate ALL ambiguity about the game before writing any code. A vague brief produces vague code. Invest heavily here.

**Read CODEBASE.md first** to understand what the template already provides (trivia game scaffold, VGF patterns, phase system). Many answers will be "keep the existing X" or "replace X with Y."

### Interview Structure

Ask questions **one category at a time**. Don't dump all questions at once — build on responses. For each question, present 2-3 likely options so the user can pick rather than invent from scratch.

#### Round 1: Core Concept (3-5 questions)

- **Genre** — What type of game? (trivia, action, puzzle, party, word game, drawing, music, etc.)
- **One-liner** — Describe the game in one sentence. What makes it fun?
- **Reference games** — What existing games is this most like? (TV shows, board games, apps)
- **Player count** — How many players? (1 solo, 2-4 competitive, 4-8 party, unlimited audience)
- **Session length** — How long should one round take? (1 min quick, 5 min standard, 15+ min deep)

#### Round 2: Core Mechanic (3-5 questions)

- **Player input** — How do players interact? (tap buttons, swipe, tilt phone, draw, type text, voice, choose from options)
- **Turn structure** — Simultaneous play, sequential turns, timed rounds, or free-for-all?
- **Scoring** — How do players score? (speed, accuracy, creativity, voting, survival)
- **Win condition** — How does the game end? (fixed rounds, timer, elimination, target score)
- **Content source** — Where does game content come from? (built-in bank, AI-generated, player-created, external API)

#### Round 3: Display Experience — TV Screen (3-5 questions)

- **Visual style** — What should the TV look like? (clean/minimal, retro/arcade, colorful/party, dark/dramatic, 3D)
- **Layout** — What's on screen during gameplay? (question + answers, game board, scoreboard, timer, player avatars)
- **Animations** — What moments need visual flair? (correct answer, scoring, round transitions, winner reveal)
- **Spectator experience** — Is it fun to watch even without playing? What makes it watchable?
- **Sound** — Background music style? Sound effects for key moments?

#### Round 4: Controller Experience — Phone (3-5 questions)

- **Primary action** — What's the main thing players do on their phone? (tap answer, draw, type, tilt, swipe)
- **Information shown** — What does the player see that's private to them? (their hand, their score, their role)
- **Feedback** — How does the player know their input was received? (haptic, visual flash, sound)
- **Waiting state** — What do players see when it's not their turn? (other players' status, spectate, mini-game)
- **Accessibility** — Any physical constraints? (one-handed play, no sound required, colour-blind safe)

#### Round 5: Game Flow (3-5 questions)

- **Phases** — Walk me through one round start to finish. What screens does the player see?
- **Lobby** — How do players join? (QR code is default — anything else? nicknames? avatars? teams?)
- **Between rounds** — What happens between rounds? (leaderboard, bonus round, new content loads)
- **Game over** — What's the end screen? (final rankings, stats, funny awards, play again)
- **Replay** — What changes between plays? (new content, difficulty scaling, different mode)

#### Round 6: Edge Cases & Polish (2-4 questions)

- **Late join** — Can players join mid-game? What happens?
- **Disconnect** — What if a player's phone disconnects? Does the game pause or continue?
- **Content volume** — How much content is needed for the first playable version? (5 items, 20, 100+)
- **Must-haves vs nice-to-haves** — What's the minimum for a fun first version?

### Interview Rules

- **Ask ONE category at a time.** Wait for answers before moving to the next round.
- **Always offer options.** Non-technical users freeze on open-ended questions. Give them 2-3 concrete choices.
- **Build on answers.** If they say "trivia game", adapt later questions (don't ask about drawing mechanics).
- **Push for specifics.** "Fun" is not specific. "Players race to buzz in first" is specific.
- **Capture the fun.** Every game needs a core tension. Identify it: time pressure, hidden information, bluffing, speed, creativity, knowledge.
- **Name the MVP.** By the end, explicitly list what's in v1 and what's deferred.
- **It's okay to suggest.** If the user is unsure, recommend based on what works for TV + phone multiplayer.

### Interview Output

After all rounds, summarise:

```
## Game Design Summary

**Name:** [game name]
**One-liner:** [description]
**Players:** [count and mode]
**Session:** [duration]

### Core Loop
[2-3 sentences describing one round of play]

### Phases
1. [Phase] — [what happens, what players see/do]
2. [Phase] — ...

### Display Screens
- [Screen 1] — [layout and key elements]
- [Screen 2] — ...

### Controller Screens  
- [Screen 1] — [what the player does]
- [Screen 2] — ...

### Content
[What content is needed, where it comes from]

### MVP Scope (v1)
- [feature 1]
- [feature 2]

### Deferred (v2+)
- [feature 1]
- [feature 2]
```

**Confirm the summary with the user before proceeding to Phase 2.**

---

## Phase 2: Plan

**Enter plan mode.** Map the game design to concrete code changes.

Read **CODEBASE.md** to understand what exists. Then create a plan that covers:

### Plan Structure

```
## Implementation Plan

### 1. Shared Types & State
- [ ] Update `packages/shared/src/types.ts` — new state fields: [list]
- [ ] Update `packages/shared/src/state.ts` — new initial values: [list]  
- [ ] Update `packages/shared/src/constants.ts` — new constants: [list]
- [ ] Add new types/interfaces: [list]

### 2. Server Game Logic
- [ ] Update `apps/server/src/phases.ts` — phases: [list with transitions]
- [ ] Update `apps/server/src/reducers.ts` — new reducers: [list]
- [ ] Update `apps/server/src/thunks.ts` — new thunks: [list]
- [ ] Replace/update `apps/server/src/questions.ts` — content source: [describe]
- [ ] Update `apps/server/src/services.ts` — server-only state: [list]

### 3. Display (TV Screen)
- [ ] New/update scenes: [list with descriptions]
- [ ] Update `SceneRouter.tsx` — route new phases
- [ ] New components: [list]
- [ ] Styling approach: [describe]
- [ ] Animations: [list]

### 4. Controller (Phone)
- [ ] New/update controllers: [list with descriptions]
- [ ] Update `PhaseRouter.tsx` — route new phases
- [ ] Input handling: [describe]
- [ ] New components: [list]

### 5. Assets & Content
- [ ] Game content: [what to create/source]
- [ ] Images/sounds: [list]
- [ ] Tile image for Foundry Hub: [describe]

### 6. Testing
- [ ] Unit tests for: [list]
- [ ] Update E2E tests: [list]

### Build Order
1. [First — usually shared types + server logic]
2. [Second — usually display scenes]
3. [Third — usually controller input]
4. [Fourth — polish, assets, testing]
```

### Planning Rules

- **Start from shared types.** Everything flows from the state shape.
- **Server before clients.** Game logic must exist before UI can consume it.
- **Display before controller.** Easier to verify visually.
- **Keep the VGF patterns.** Phase system, WoF transitions, provider structure — don't fight the framework.
- **Reuse what exists.** The template has working lobby, playing, gameOver phases. Extend, don't rewrite from scratch.
- **Note what's kept as-is.** Explicitly say "keep existing LobbyScene" if the lobby doesn't need changes.

**Get user approval on the plan before proceeding to Phase 3.**

---

## Phase 3: Build

Execute the plan step by step. For each step:

1. **Announce what you're doing** — "Step 1: Updating shared types..."
2. **Make the changes**
3. **Verify** — build, test, render check (per AGENTS.md verification block)
4. **Show progress** — "Done. 3 of 6 steps complete."

### Build Rules

- Follow the build order from the plan
- Run `pnpm build` after each major step (don't wait until the end)
- Run `pnpm dev` and verify display/controller render after UI changes
- Commit after each working milestone (not after every file change)
- If something doesn't work, fix it before moving to the next step
- If the plan needs to change mid-build, update the plan document and note why

### After Build Complete

1. Run full verification: `pnpm build && pnpm test`
2. Start dev server: `pnpm dev`
3. Verify display at http://localhost:3000
4. Verify controller at http://localhost:5174
5. Walk the user through how to test the full flow
6. Generate a tile image if artwork tooling is available (`scripts/generate-art.mjs`)
7. Ask if they want to deploy: `crucible publish [game-id]`

---

## Example

```
User: /build-game I want a game where players guess songs

Agent: Great starting point! Let me learn more about your vision.

**Round 1: Core Concept**

1. What kind of song guessing? 
   a) Hear a clip, name the song (like Name That Tune)
   b) See lyrics, guess the song
   c) Hum/sing, others guess
   
2. How many players?
   a) 2-4 competitive
   b) 4-8 party
   c) Solo vs AI

[... continues through all 6 rounds ...]

## Game Design Summary
**Name:** Beat Drop
**One-liner:** Players race to identify songs from short clips
[...]

Does this look right? Ready to plan the implementation?

User: Yes!

[enters plan mode, creates implementation plan, gets approval, builds]
```
