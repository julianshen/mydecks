import { test, expect } from '@playwright/test';

test.describe('Presentation Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('new-deck-btn').click();
    await page.getByTestId('deck-title-input').fill('Presentation Test');
    await page.getByTestId('create-deck-btn').click();
    await expect(page.getByTestId('editor-page')).toBeVisible();
  });

  test('should enter presentation mode', async ({ page }) => {
    await page.getByTestId('tool-present').click();
    await expect(page.getByTestId('presenter-page')).toBeVisible();
    await expect(page.getByTestId('present-slide')).toBeVisible();
  });

  test('should navigate slides with keyboard', async ({ page }) => {
    // Add a second slide
    await page.getByTestId('add-slide-btn').click();

    // Enter presentation
    await page.getByTestId('tool-present').click();
    await expect(page.getByTestId('presenter-page')).toBeVisible();

    // Check slide counter
    await expect(page.getByText('1 / 2')).toBeVisible();

    // Next slide
    await page.keyboard.press('ArrowRight');
    await expect(page.getByText('2 / 2')).toBeVisible();

    // Previous slide
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByText('1 / 2')).toBeVisible();
  });

  test('should exit presentation with escape', async ({ page }) => {
    await page.getByTestId('tool-present').click();
    await expect(page.getByTestId('presenter-page')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('editor-page')).toBeVisible();
  });
});
