# /deploy

Guided deployment for users who don't know the CLI. Gets your game from local to live on Fire TV.

## Usage

```
/deploy                # Deploy this game to Fire TV
/deploy status         # Check current deployment status
```

## Instructions

When the user invokes this skill:

### 1. Pre-flight Checks

Run these in order. Stop at the first failure and help the user fix it.

```
## Pre-flight Checklist

- [ ] Build passes (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] `crucible.json` exists and has valid gameId
- [ ] GitHub token is available (GITHUB_TOKEN env var or Foundry settings)
- [ ] Game has been committed to git (`git status` is clean)
- [ ] Remote is set to a Volley-Inc repo (`git remote -v`)
```

**If build fails:**
> "The build is broken — let me fix it before we deploy."
Fix the build error, then re-run.

**If tests fail:**
> "Some tests are failing. Let me fix them first — we don't want to deploy broken code."
Fix tests, then re-run.

**If no GitHub token:**
> "I need a GitHub token to deploy. You can set it up in the Foundry desktop app under Settings → Connections, or set the GITHUB_TOKEN environment variable."
Wait for the user to configure it.

**If uncommitted changes:**
> "You have uncommitted changes. I'll commit them before deploying."
Stage and commit with a descriptive message.

**If no remote:**
> "This game isn't connected to a GitHub repository yet. I'll set that up."
Check if a `crucible-game-[id]` repo exists, create if needed, push.

### 2. Deploy

Once pre-flight passes:

```bash
# Push latest code to GitHub
git push origin main

# Trigger deployment
crucible publish [game-id]
```

If `crucible publish` isn't available (running in plain Claude Code, not Foundry), fall back to:

```bash
# Push to trigger CI/CD
git push origin main
# The .github/workflows/crucible-deploy.yml will handle the rest
```

### 3. Monitor

After triggering deployment, explain what's happening:

> "Deployment started! Here's what's happening behind the scenes:
> 1. GitHub Actions is building a Docker image for your game (~2-3 minutes)
> 2. The image will be pushed to the container registry
> 3. Bifrost will pick it up and deploy it to Kubernetes
> 4. Your game will appear in Foundry Hub on the Fire TV
>
> This usually takes 3-5 minutes total."

If possible, check CI status:

```bash
# Check if workflow is running
gh run list --workflow=crucible-deploy.yml --limit 1
```

Report status to the user:
- **In progress:** "Still building... the Docker image is being created."
- **Success:** "Deployed! Your game should appear on the Fire TV within a minute. Try refreshing Foundry Hub."
- **Failed:** "The deployment failed. Let me check what went wrong."

### 4. Handle Failures

If deployment fails, check the CI logs:

```bash
gh run view [run-id] --log-failed
```

Common failures and fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| "Dockerfile not found" | Missing or renamed Dockerfile | Ensure `Dockerfile` exists at repo root |
| "Build failed" | Code doesn't compile in Docker | Run `pnpm build` locally, fix errors |
| "Push denied" | Token lacks permission | Check GitHub token has `repo` and `packages:write` scopes |
| "Image push failed" | Registry auth issue | Check CI workflow has correct registry credentials |
| "Timeout" | Build taking too long | Check for large assets or unnecessary dependencies in Docker build |

After fixing, re-run the deployment:

```bash
git add -A && git commit -m "fix: [what was fixed]" && git push origin main
```

### 5. Verify

Once deployment succeeds:

> "Your game is live! Here's how to see it:
> 1. Open Foundry Hub on the Fire TV (or refresh if already open)
> 2. Navigate to your game in the carousel
> 3. Select it and verify it loads
> 4. Scan the QR code with your phone to test the controller
>
> If you don't see it, try restarting the VWR app on the Fire TV."

### Status Check (`/deploy status`)

When invoked with `status`:

```bash
# Check latest deployment
crucible status [game-id]

# Or check GitHub Actions
gh run list --workflow=crucible-deploy.yml --limit 3
```

Report:
```
## Deployment Status: [game-id]

- **Last deploy:** [date/time]
- **CI status:** [success/failed/running]
- **Bifrost:** [running/building/not deployed]
- **URL:** [game URL if deployed]
```

## Plain English Error Messages

Never show raw error output to non-technical users. Translate:

| Raw Error | Say This Instead |
|-----------|-----------------|
| `CRUCIBLE-102: GitHub token not found` | "I need your GitHub credentials. Go to Foundry → Settings → Connections and add your GitHub token." |
| `CRUCIBLE-201: Repository already exists` | "This game already has a repository. I'll use the existing one." |
| `exit code 1` | "Something went wrong during the build. Let me check the details..." |
| `ECONNREFUSED` | "I can't reach GitHub right now. Check your internet connection." |
| `Permission denied` | "Your GitHub token doesn't have the right permissions. It needs 'repo' scope." |

## When to Use

- After `/build-game` and `/playtest` pass — the natural next step
- When the user says "deploy", "push to TV", "put it on the TV", "ship it"
- When the user asks "is my game live?" (use `/deploy status`)
