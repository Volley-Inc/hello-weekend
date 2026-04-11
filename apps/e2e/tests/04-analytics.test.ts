import { test, expect, type Page } from "@playwright/test";

const DISPLAY_URL = "http://localhost:3000?sessionId=dev-test";
const CONTROLLER_URL = "http://localhost:5174?sessionId=dev-test";
const QUESTIONS_PER_ROUND = 5;

/** Timeout for waiting on VGF phase transitions (state sync has latency). */
const PHASE_TIMEOUT = 15_000;

const SERVER_URL = "http://127.0.0.1:8090";

async function submitAnswer(page: Page, answer: string) {
    const input = page.locator("input[type='text']");
    await input.fill(answer);
    await page.locator("[data-action='submit-answer']").click();
    // Wait for VGF thunk processing + state sync round-trip
    await page.waitForTimeout(3000);
}

async function resetAndNavigate(
    displayPage: Page,
    controllerPage: Page,
): Promise<void> {
    await fetch(`${SERVER_URL}/api/reset-session`, { method: "POST" });
    await new Promise((r) => setTimeout(r, 500));
    await displayPage.goto(DISPLAY_URL);
    await controllerPage.goto(CONTROLLER_URL);
    await expect(
        controllerPage.locator("[data-phase='lobby']"),
    ).toBeVisible({ timeout: PHASE_TIMEOUT });
    await expect(
        displayPage.locator("[data-phase='lobby']"),
    ).toBeVisible({ timeout: PHASE_TIMEOUT });
}

/**
 * Play through all questions to reach game over.
 * Uses a generous loop count to handle question count variation.
 */
async function playThroughAllQuestions(
    controllerPage: Page,
): Promise<void> {
    for (let i = 0; i < QUESTIONS_PER_ROUND + 2; i++) {
        const done = await controllerPage
            .locator("[data-phase='game-over']")
            .isVisible()
            .catch(() => false);
        if (done) return;

        const stillPlaying = await controllerPage
            .locator("[data-phase='playing']")
            .isVisible()
            .catch(() => false);
        if (!stillPlaying) break;

        await submitAnswer(controllerPage, "skip");
    }
}

test.describe("analytics integration", () => {
    test("game flow completes with analytics modules loaded (no console errors)", async ({
        browser,
    }) => {
        const displayCtx = await browser.newContext();
        const controllerCtx = await browser.newContext();
        const displayPage = await displayCtx.newPage();
        const controllerPage = await controllerCtx.newPage();

        // Collect console errors from both pages
        const displayErrors: string[] = [];
        const controllerErrors: string[] = [];

        displayPage.on("console", (msg) => {
            if (msg.type() === "error") displayErrors.push(msg.text());
        });
        controllerPage.on("console", (msg) => {
            if (msg.type() === "error") controllerErrors.push(msg.text());
        });

        try {
            await resetAndNavigate(displayPage, controllerPage);

            // Start game
            await controllerPage.locator("[data-action='start-game']").click();
            await expect(
                displayPage.locator("[data-phase='playing']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });
            await expect(
                controllerPage.locator("[data-phase='playing']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });

            // Play through all questions
            await playThroughAllQuestions(controllerPage);

            // Reach game over
            await expect(
                displayPage.locator("[data-phase='game-over']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });

            // Controller reload to force fresh VGF state sync
            // Known VGF limitation: controller may not receive server-initiated phase transitions
            await controllerPage.reload();
            await expect(
                controllerPage.locator("[data-phase='game-over']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });

            // Verify no console errors related to tracking/analytics
            const trackingErrors = displayErrors.filter(
                (e) =>
                    e.toLowerCase().includes("tracking") ||
                    e.toLowerCase().includes("analytics") ||
                    e.toLowerCase().includes("amplitude") ||
                    e.toLowerCase().includes("segment") ||
                    e.toLowerCase().includes("datadog"),
            );
            const controllerTrackingErrors = controllerErrors.filter(
                (e) =>
                    e.toLowerCase().includes("tracking") ||
                    e.toLowerCase().includes("analytics") ||
                    e.toLowerCase().includes("amplitude") ||
                    e.toLowerCase().includes("segment") ||
                    e.toLowerCase().includes("datadog"),
            );

            expect(trackingErrors).toEqual([]);
            expect(controllerTrackingErrors).toEqual([]);
        } finally {
            await displayCtx.close();
            await controllerCtx.close();
        }
    });

    test("controller connects with valid sessionId", async ({ browser }) => {
        const controllerCtx = await browser.newContext();
        const controllerPage = await controllerCtx.newPage();

        try {
            await controllerPage.goto(CONTROLLER_URL);

            // Verify the URL has a non-empty sessionId parameter
            const url = new URL(controllerPage.url());
            const sessionId = url.searchParams.get("sessionId");
            expect(sessionId).toBeTruthy();
            expect(sessionId).toBe("dev-test");

            // Verify the PhaseRouter renders (phase appears in DOM)
            await expect(
                controllerPage.locator("[data-phase]"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });
        } finally {
            await controllerCtx.close();
        }
    });

    test("ErrorBoundary does not interfere with normal rendering", async ({
        browser,
    }) => {
        const displayCtx = await browser.newContext();
        const displayPage = await displayCtx.newPage();

        // Track page errors (uncaught exceptions)
        const pageErrors: string[] = [];
        displayPage.on("pageerror", (err) => {
            pageErrors.push(err.message);
        });

        try {
            await displayPage.goto(DISPLAY_URL);

            // Verify the SceneRouter renders inside the ErrorBoundary
            // (i.e. the page shows a phase, not the error fallback)
            await expect(
                displayPage.locator("[data-phase]"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });

            // Verify no error boundary fallback is shown
            const fallbackVisible = await displayPage
                .locator("text=Something went wrong")
                .isVisible()
                .catch(() => false);
            expect(fallbackVisible).toBe(false);

            // No uncaught page errors
            expect(pageErrors).toEqual([]);
        } finally {
            await displayCtx.close();
        }
    });

    test("phase transitions fire without tracking errors", async ({
        browser,
    }) => {
        const displayCtx = await browser.newContext();
        const controllerCtx = await browser.newContext();
        const displayPage = await displayCtx.newPage();
        const controllerPage = await controllerCtx.newPage();

        // Track uncaught exceptions on both pages
        const displayErrors: string[] = [];
        const controllerErrors: string[] = [];

        displayPage.on("pageerror", (err) => {
            displayErrors.push(err.message);
        });
        controllerPage.on("pageerror", (err) => {
            controllerErrors.push(err.message);
        });

        try {
            // Phase 1: lobby
            await resetAndNavigate(displayPage, controllerPage);

            await expect(
                displayPage.locator("[data-phase='lobby']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });
            await expect(
                controllerPage.locator("[data-phase='lobby']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });
            expect(displayErrors).toEqual([]);
            expect(controllerErrors).toEqual([]);

            // Phase 2: playing
            await controllerPage.locator("[data-action='start-game']").click();

            await expect(
                displayPage.locator("[data-phase='playing']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });
            await expect(
                controllerPage.locator("[data-phase='playing']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });
            expect(displayErrors).toEqual([]);
            expect(controllerErrors).toEqual([]);

            // Play through all questions to reach game over
            await playThroughAllQuestions(controllerPage);

            // Phase 3: game over
            await expect(
                displayPage.locator("[data-phase='game-over']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });

            // Controller reload to force fresh VGF state sync
            // Known VGF limitation: controller may not receive server-initiated phase transitions
            await controllerPage.reload();
            await expect(
                controllerPage.locator("[data-phase='game-over']"),
            ).toBeVisible({ timeout: PHASE_TIMEOUT });

            // No uncaught exceptions across all phase transitions
            expect(displayErrors).toEqual([]);
            expect(controllerErrors).toEqual([]);
        } finally {
            await displayCtx.close();
            await controllerCtx.close();
        }
    });
});
