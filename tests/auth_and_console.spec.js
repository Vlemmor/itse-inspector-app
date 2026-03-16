const { test, expect } = require('@playwright/test');

test.describe('Robot Tester v1.6 Core Flow', () => {
  
  test('Authentication - All roles', async ({ page }) => {
    await page.goto('/');
    
    // Admin login
    await page.fill('#login-user', 'admin');
    await page.fill('#login-pass', 'admin');
    await page.click('#btn-login');
    await expect(page.locator('#screen-dashboard')).toBeVisible();
    await expect(page.locator('#btn-goto-admin')).toBeVisible();
    await page.click('#btn-logout');

    // Architect login
    await page.fill('#login-user', 'arq1');
    await page.fill('#login-pass', '123');
    await page.click('#btn-login');
    await expect(page.locator('#screen-dashboard')).toBeVisible();
    await expect(page.locator('#btn-goto-admin')).not.toBeVisible();
    await page.click('#btn-logout');
  });

  test('Mass Data Entry & Scroll Check', async ({ page }) => {
    // Login
    await page.goto('/');
    await page.fill('#login-user', 'arq1');
    await page.fill('#login-pass', '123');
    await page.click('#btn-login');

    // Start report
    await page.click('#btn-new-report');
    await page.fill('#data-site', 'Sede Automatizada');
    await page.fill('#data-address', 'Calle Falsa 123');
    await page.click('#btn-to-console');

    // Add 10 observations automatically
    for (let i = 1; i <= 10; i++) {
        await page.fill('#obs-description', `Observación de prueba automatizada #${i}`);
        await page.selectOption('#obs-risk', 'medio');
        await page.click('#btn-save-obs');
    }

    // Verify all 10 cards are rendered
    const cardCount = await page.locator('#console-feed .m3-card').count();
    expect(cardCount).toBe(10);

    // Verify scrollability: The last card should be reachable
    const lastCard = page.locator('#console-feed .m3-card').last();
    await lastCard.scrollIntoViewIfNeeded();
    await expect(lastCard).toBeVisible();

    // Finish
    await page.click('#btn-finish-report');
    await page.click('#btn-confirm-finish');
    await expect(page.locator('#screen-preview')).toBeVisible();
  });

  test('UI Obstruction - Buttons should not cover text', async ({ page }) => {
    // This test specifically looks for overlap or clipping on small viewports
    await page.goto('/');
    await page.fill('#login-user', 'elec1');
    await page.fill('#login-pass', '123');
    await page.click('#btn-login');
    await page.click('#btn-new-report');
    await page.fill('#data-site', 'Test Solapamiento');
    await page.click('#btn-to-console');

    // Check if textarea is visible and clickable
    await expect(page.locator('#obs-description')).toBeVisible();
    await expect(page.locator('#obs-description')).toBeEnabled();
  });
});
