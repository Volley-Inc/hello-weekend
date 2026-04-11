# Upgrading Dependencies

> **For AI agents and developers.** This guide covers how to upgrade VGF, Platform SDK, analytics libraries, and how template updates propagate to downstream game projects.
>
> **Last updated:** April 2026 | **Current template versions:** VGF 4.13.0, Platform SDK 7.50.0

---

## Table of Contents

1. [Upgrading VGF (Volley Games Framework)](#1-upgrading-vgf)
2. [Upgrading Platform SDK](#2-upgrading-platform-sdk)
3. [Updating Existing Game Projects](#3-updating-existing-game-projects)
4. [Analytics Dependencies](#4-analytics-dependencies)
5. [General Upgrade Checklist](#5-general-upgrade-checklist)
6. [Things Every Agent Should Know](#6-things-every-agent-should-know)

---

## 1. Upgrading VGF

### Where VGF is declared

VGF (`@volley/vgf`) appears in multiple workspace packages:

| Package | File |
|---------|------|
| `@hello-weekend/server` | `apps/server/package.json` |
| `@hello-weekend/display` | `apps/display/package.json` |
| `@hello-weekend/controller` | `apps/controller/package.json` |

The `packages/shared` package does NOT depend on VGF directly -- it contains only pure game state types and helpers.

### Check the current version

```bash
pnpm ls @volley/vgf
```

This shows the installed version across all workspace packages. To check the latest published version:

```bash
npm view @volley/vgf version
```

### How to upgrade

```bash
pnpm update @volley/vgf --recursive
```

This updates `@volley/vgf` in every workspace package that declares it. After upgrading, always run the [full checklist](#5-general-upgrade-checklist).

### Breaking changes by version

These are the critical breaking changes that have caused real failures in Volley game projects. Each is documented in detail in the [learnings index](../learnings/INDEX.md).

#### VGF 4.8.0+ -- PhaseModificationError

Reducers **cannot** modify `state.phase`. Any reducer that sets `state.phase` directly will throw `PhaseModificationError` at runtime. Use the WoF (Wheel of Fortune) pattern instead:

1. Add `nextPhase: string | null` to your game state
2. Create a `SET_NEXT_PHASE` reducer that sets `state.nextPhase` (NOT `state.phase`)
3. Create a `CLEAR_NEXT_PHASE` reducer that resets `nextPhase` to `null`
4. Configure `endIf` on all phases to check `state.nextPhase !== null && state.nextPhase !== state.phase`
5. Configure `next` to return `state.nextPhase`
6. Call `CLEAR_NEXT_PHASE` in each phase's `onBegin`

See: [019-vgf-480-phase-transitions.md](../learnings/019-vgf-480-phase-transitions.md)

#### VGF 4.9.1+ -- Socket.IO `onAny` workaround

Earlier VGF versions required a workaround for Socket.IO `onAny` because ack callback forwarding was broken. As of 4.9.1, this is fixed upstream. If your codebase has a manual `onAny` listener that re-emits messages, **remove it** after upgrading -- it will cause double-processing.

See: [018-vgf-socketio-message-workarounds.md](../learnings/018-vgf-socketio-message-workarounds.md)

#### VGF 4.11.0+ -- `ctx.dispatch()` returns `Promise<void>`

`ctx.dispatch()` inside thunks now returns a `Promise<void>` that resolves after the reducer runs. This means you can `await ctx.dispatch(...)` to get fresh state immediately afterward via `ctx.getState()`. Previously, state reads after dispatch could be stale.

#### VGF 4.13.0 -- `WGFServer` import path

The `WGFServer` class must be imported from `@volley/vgf/server`. The bare specifier `@volley/vgf` does NOT export anything. Full import map:

| Type | Import from |
|------|-------------|
| `WGFServer`, `MemoryStorage`, `IThunkContext` | `@volley/vgf/server` |
| `IOnBeginContext`, `ISession`, `GameThunk` | `@volley/vgf/types` |
| `VGFProvider`, `SocketIOClientTransport`, `createSocketIOClientTransport`, `ClientType`, `getVGFHooks` | `@volley/vgf/client` |
| `IGameActionContext` | **Not exported** -- use `{ session: ISession<YourState> }` |

### Common gotchas

- **Subpath imports are mandatory.** `import { ... } from "@volley/vgf"` does NOT work. Always use `@volley/vgf/server`, `@volley/vgf/client`, or `@volley/vgf/types`.
- **`MemoryStorage` location.** Imported from `@volley/vgf/server`, NOT from a separate package.
- **`schedulerStore` is required.** `WGFServer` will throw if you don't provide it. For dev, use a noop: `{ load: async () => null, save: async () => {}, remove: async () => {} }`.
- **`console` is NOT a valid logger.** `WGFServer` requires `ILogger` from `@volley/logger` (has `.fatal()` and `.child()`). Use `createLogger({ type: "node" })`.
- **Game state interface must include `[key: string]: unknown`.** `BaseGameState` extends `Record<string, unknown>`.

### Testing after upgrade

```bash
pnpm typecheck          # Catch import path / type changes
pnpm test               # Run all unit tests
pnpm dev                # Manual playtest -- start game, answer questions, verify phase transitions
```

---

## 2. Upgrading Platform SDK

### Where declared

| Package | File |
|---------|------|
| `@hello-weekend/display` | `apps/display/package.json` |
| `@hello-weekend/controller` | `apps/controller/package.json` |

The server does NOT use Platform SDK.

### Check and upgrade

```bash
pnpm ls @volley/platform-sdk
npm view @volley/platform-sdk version
pnpm update @volley/platform-sdk --recursive
```

### React hooks and providers

Platform SDK exposes React hooks via `@volley/platform-sdk/react`:

- `PlatformProvider` / `MaybePlatformProvider` -- wraps the app with platform context
- `useDeviceInfo()` -- returns device info object (use `.getDeviceId()`, NOT destructuring)
- `useKeyDown()` -- D-pad remote key handler

### Breaking changes to watch for

#### Auth endpoint changes

- Dev/staging: `auth-dev.volley.tv`
- Production: `auth.volley.tv`

Do NOT hardcode these. Platform URLs must be stage-aware (lookup table: local/dev -> dev, staging -> staging, production -> production).

#### `gameId` parameter

`PlatformProvider` requires a `gameId` prop. Omitting it will fail silently or throw depending on the version.

#### `trustedOrigins` for BrowserIpc

When running inside the VWR (Volley Web Runtime) iframe, `BrowserIpc` needs `trustedOrigins` to be configured for cross-origin message passing. Without this, controller-to-display communication fails in production.

#### Stage values

Stage values must be one of `"dev" | "staging" | "production"`. Note: it is `"production"`, NOT `"prod"`. Passing `"prod"` will fail silently.

### Fire TV compatibility

If targeting Fire TV, test on actual hardware or the Fire TV emulator. Fire TV runs Chrome 68, which lacks:
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- `globalThis`
- `Array.prototype.at()`

Vite's build target should be set to `es2017` or lower for Fire TV builds.

---

## 3. Updating Existing Game Projects

Games created from this template can receive updates via the Crucible template system.

### How Crucible template updates work

The `crucible update` command performs a 3-way merge of template changes into existing games:

1. **Compares** the template at the game's last-synced ref against the current template HEAD
2. **Classifies** each template file by its merge strategy
3. **Applies** changes to the game project

### File classification strategies

| Strategy | What happens | Examples |
|----------|-------------|---------|
| `regenerate` | File is regenerated from template on every update | `Dockerfile`, CI workflow files |
| `overwrite` | Template version always wins | `pnpm-workspace.yaml`, `tsconfig.base.json` |
| `merge` | 3-way merge, game-specific changes preserved | Source files, component files |
| `ignore` | Never touched | `node_modules/`, `dist/`, `.env` |

### The `crucible.json` file

Downstream games (NOT this template) contain a `crucible.json` that tracks:

```json
{
  "templateRepo": "volley/hello-weekend",
  "templateRef": "v1.2.0",
  "templateChecksums": { ... }
}
```

- `templateRepo` -- which template the game was created from
- `templateRef` -- the git tag/ref the game was last synced to
- `templateChecksums` -- SHA hashes of template files at that ref (used for 3-way merge)

### When upgrading VGF/Platform SDK in the template

When you bump VGF or Platform SDK versions in this template, **all downstream games** created from it need the update too. The propagation path is:

1. Bump versions in this template's `package.json` files
2. Tag a new template version (e.g. `v1.3.0`)
3. Downstream games run `crucible update` to pull in the changes
4. The automated workflow (`.github/workflows/crucible-template-update.yml`) can do this automatically for games that have it configured

### Manual update command

```bash
crucible update --game-path /path/to/downstream-game
```

---

## 4. Analytics Dependencies

Analytics libraries are split across server and client packages. They are designed to gracefully no-op without environment variables, so upgrading them will not break local development.

### Server analytics (`apps/server/package.json`)

| Package | Purpose | Current version |
|---------|---------|----------------|
| `dd-trace` | Datadog APM tracing (monkey-patches at import) | ^5.0.0 |
| `@segment/analytics-node` | Segment event tracking (server-side) | ^2.1.0 |
| `@amplitude/analytics-node` | Amplitude business metrics (server-side) | ^1.3.0 |
| `hot-shots` | StatsD/Datadog custom metrics | ^10.0.0 |

### Display and controller analytics (`apps/display/package.json`, `apps/controller/package.json`)

| Package | Purpose | Current version |
|---------|---------|----------------|
| `@datadog/browser-rum` | Datadog Real User Monitoring | ^6.0.0 |
| `@datadog/browser-logs` | Datadog browser log collection | ^6.0.0 |
| `@amplitude/analytics-browser` | Amplitude business metrics (browser-side) | ^2.11.0 |

### No-op behaviour

All analytics libraries check for environment variables (`DD_AGENT_HOST`, `SEGMENT_WRITE_KEY`, `AMPLITUDE_API_KEY`, etc.) at initialisation. If the variables are missing, they silently no-op. This means:

- Local `pnpm dev` works without any analytics config
- You can upgrade these packages without breaking the dev environment
- CI tests pass without analytics credentials

### Breaking changes when upgrading

Watch for these major version transitions:

| Transition | Key changes |
|-----------|-------------|
| Segment Node SDK v2 -> v3 | `Analytics` constructor API changes, `.track()` signature differences |
| Datadog RUM v5 -> v6 | `init()` configuration changes, `allowedTracingUrls` replaces `allowedTracingOrigins` |
| Amplitude Node v1 -> v2 | `init()` becomes async, `setUserId()` method changes |

---

## 5. General Upgrade Checklist

Run through this checklist after any dependency upgrade:

- [ ] Update deps in all workspace packages: `pnpm update --recursive`
- [ ] Run `pnpm typecheck` across all apps
- [ ] Run `pnpm test` across all apps (unit tests)
- [ ] Run E2E tests: `pnpm --filter e2e test`
- [ ] Manual playtest: `pnpm dev`, start a game, answer questions, verify game-over transition works
- [ ] Check Fire TV compatibility if targeting TV (test with `es2017` build target)
- [ ] Update `crucible.json` `templateRef` if bumping template version in a downstream game
- [ ] Tag a new template version for downstream games if this is the template repo

### Quick smoke test

The minimum viable test after a VGF upgrade:

```bash
pnpm typecheck && pnpm test && echo "PASS"
```

If typecheck fails, the most common causes are:
1. Import path changes (bare specifier vs subpath exports)
2. New required properties on `WGFServer` options
3. Game state interface missing `[key: string]: unknown`

---

## 6. Things Every Agent Should Know

### Required reading

- **[learnings/INDEX.md](../learnings/INDEX.md)** -- Full index of VGF, Socket.IO, React, and Platform SDK gotchas learned across four game projects. Check the "Quick Reference by Task Type" table before starting any upgrade work.
- **[BUILDING_TV_GAMES.md](../BUILDING_TV_GAMES.md)** -- Canonical guide to building Volley TV games. The "For AI Agents" section at the top lists 40 failure modes.
- **[ai-agent-things/learnings/](../../ai-agent-things/learnings/)** -- Extended learnings directory with detailed write-ups.

### pnpm workspaces

This template uses pnpm workspaces. Always use `--filter` or `--recursive` flags:

```bash
pnpm --filter @hello-weekend/server add some-package   # Add to one workspace
pnpm update @volley/vgf --recursive                     # Update across all workspaces
pnpm --filter @hello-weekend/e2e test                   # Run tests in one workspace
```

Never use bare `pnpm add` or `pnpm install` from a subdirectory -- it will create a local `node_modules` that shadows the workspace.

### ESM server

The server uses ESM (`"type": "module"` in `package.json`). This means:
- `import` / `export` syntax only
- `require()` does NOT work, except for `dd-trace` monkey-patching (must be the first import)
- File extensions are NOT required in source (TypeScript handles resolution) but ARE required in compiled output

### VGF state starts as `{}`

VGF initialises game state as an empty object `{}`. ALWAYS guard with `"phase" in state` before accessing any phase-specific fields. Failing to do this causes `TypeError: Cannot read properties of undefined` on first render.

```typescript
// WRONG
const currentPhase = state.phase;

// RIGHT
if ("phase" in state) {
  const currentPhase = state.phase;
}
```

### DispatchTimeoutError is expected

`WGFServer` does NOT send Socket.IO acknowledgements for thunk dispatches that trigger phase transitions. The client-side `dispatchThunk()` will reject with `DispatchTimeoutError` after 10 seconds. This is expected behaviour -- suppress it:

```typescript
try {
  await dispatchThunk("SOME_ACTION", payload);
} catch (err) {
  if (err instanceof Error && err.name === "DispatchTimeoutError") {
    // Expected -- VGF server doesn't ack phase-transition thunks
    return;
  }
  throw err;
}
```

### Dev session lifecycle

The dev server re-creates sessions every 2 seconds because VGF deletes sessions on client disconnect. Do not rely on session persistence across browser tab closes. The `dev.ts` script uses `setInterval(ensureDevSession, 2000)` to keep the session alive.

### Version verification

Before writing any `package.json` changes, always check actual published versions:

```bash
npm view @volley/vgf version
npm view @volley/platform-sdk version
npm view @volley/logger version
```

The versions in this document and in `BUILDING_TV_GAMES.md` may be stale. The npm registry is the source of truth.
