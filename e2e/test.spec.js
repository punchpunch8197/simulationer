
import { test, expect } from '@playwright/test';

test('Main Page loads successfully', async ({ page }) => {
    await page.goto('http://localhost:5175/');
    await expect(page).toHaveTitle(/시뮬레이셔너|Vite \+ React/);
    await expect(page.locator('h1')).toContainText('나만의');
    await expect(page.locator('h1')).toContainText('상상 세상');
});

test('Character Creation Flow', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:5175/characters/new');
    await page.waitForSelector('input[name="name"]');

    // Fill form
    await page.locator('input[name="name"]').fill('Playwright Test Char');
    await page.locator('textarea[name="description"]').fill('A testing robot');
    await page.locator('input[name="tool"]').fill('Automated Hammer');

    // Click Generate
    await page.click('button:has-text("캐릭터 소환하기!")');

    // Check for loading state
    await expect(page.locator('text=소환 마법을 거는 중...')).toBeVisible();

    // Note: We don't wait for completion here as it consumes real API credits and might be slow.
    // We just verify the UI interaction works.
});
