import { test, expect } from '@playwright/test';

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('new-deck-btn').click();
    await page.getByTestId('deck-title-input').fill('Export Test');
    await page.getByTestId('create-deck-btn').click();
    await expect(page.getByTestId('editor-page')).toBeVisible();
  });

  test('should export deck as PPTX', async ({ page }) => {
    await page.getByTestId('tool-export').click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pptx').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pptx$/);
  });

  test('should export deck as PDF', async ({ page }) => {
    await page.getByTestId('tool-export').click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-pdf').click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
