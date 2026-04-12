import { expect, type Page } from "@playwright/test";

const PHASE_TIMEOUT = 15_000;

/**
 * Wait for a specific phase on the controller page, with reload-retry.
 *
 * Known VGF limitation (learning 018): controllers may miss server-initiated
 * phase transitions via state broadcast. If the phase isn't visible after a
 * short wait, reload the page to force a fresh state sync.
 */
export async function waitForControllerPhase(
    controllerPage: Page,
    phase: string,
    timeout = PHASE_TIMEOUT,
): Promise<void> {
    const locator = controllerPage.locator(`[data-phase='${phase}']`);
    const visible = await locator
        .waitFor({ state: "visible", timeout: 5_000 })
        .then(() => true)
        .catch(() => false);

    if (!visible) {
        await controllerPage.reload();
        await expect(locator).toBeVisible({ timeout });
    }
}
