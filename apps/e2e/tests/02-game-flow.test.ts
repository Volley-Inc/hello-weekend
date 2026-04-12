import { test, expect } from "@playwright/test";
import { waitForControllerPhase } from "./helpers";

const DISPLAY_URL = "http://localhost:3000?sessionId=dev-test";
const CONTROLLER_URL = "http://localhost:5174?sessionId=dev-test";
const SERVER_URL = "http://127.0.0.1:8090";
const QUESTIONS_PER_ROUND = 5;

/** Timeout for waiting on VGF phase transitions (state sync has latency). */
const PHASE_TIMEOUT = 15_000;

test("full game flow: lobby → playing → game over", async ({ browser }) => {
  // Reset session to clean state (previous test may have left stale session)
  await fetch(`${SERVER_URL}/api/reset-session`, { method: "POST" });
  await new Promise((r) => setTimeout(r, 500));

  // Create separate browser contexts for display and controller
  const displayContext = await browser.newContext();
  const controllerContext = await browser.newContext();

  const displayPage = await displayContext.newPage();
  const controllerPage = await controllerContext.newPage();

  try {
    // 1. Open display — should show lobby phase
    await displayPage.goto(DISPLAY_URL);
    await expect(displayPage.locator("[data-phase='lobby']")).toBeVisible({
      timeout: PHASE_TIMEOUT,
    });

    // 2. Open controller — should show lobby phase
    await controllerPage.goto(CONTROLLER_URL);
    await expect(controllerPage.locator("[data-phase='lobby']")).toBeVisible({
      timeout: PHASE_TIMEOUT,
    });

    // 3. Click "Start Game" on the controller
    await controllerPage.locator("[data-action='start-game']").click();

    // 4. Verify both display and controller transition to playing phase
    await expect(displayPage.locator("[data-phase='playing']")).toBeVisible({
      timeout: PHASE_TIMEOUT,
    });
    await waitForControllerPhase(controllerPage, "playing");

    // 5. Submit answers for all questions via the text input fallback
    for (let i = 0; i < QUESTIONS_PER_ROUND; i++) {
      // Wait for the playing phase to still be visible (ensures we haven't transitioned early)
      const playingLocator = controllerPage.locator("[data-phase='playing']");
      const gameOverLocator = controllerPage.locator("[data-phase='game-over']");

      // If we're already at game-over, break (can happen if fewer questions than expected)
      const isGameOver = await gameOverLocator.isVisible().catch(() => false);
      if (isGameOver) break;

      await expect(playingLocator).toBeVisible({ timeout: PHASE_TIMEOUT });

      // Clear any previous input, type answer via keystrokes, submit
      const input = controllerPage.locator("input[type='text']");
      await input.click();
      await input.fill("");
      await input.type(`answer${i + 1}`, { delay: 50 });
      await input.press("Enter");

      // Wait for VGF thunk processing + state sync round-trip
      await controllerPage.waitForTimeout(3000);
    }

    // 6. Verify display transitions to game over
    await expect(displayPage.locator("[data-phase='game-over']")).toBeVisible({
      timeout: PHASE_TIMEOUT,
    });

    // 7. Verify controller transitions to game over
    await waitForControllerPhase(controllerPage, "game-over");
  } finally {
    await displayContext.close();
    await controllerContext.close();
  }
});
