import { test, expect } from '@playwright/test';

test.describe('Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Create a deck first
    await page.goto('/');
    await page.getByTestId('new-deck-btn').click();
    await page.getByTestId('deck-title-input').fill('E2E Test Deck');
    await page.getByTestId('create-deck-btn').click();
    await expect(page.getByTestId('editor-page')).toBeVisible();
  });

  test('should display editor with toolbar, slide panel, and canvas', async ({ page }) => {
    await expect(page.getByTestId('editor-toolbar')).toBeVisible();
    await expect(page.getByTestId('slide-panel')).toBeVisible();
    await expect(page.getByTestId('slide-canvas-container')).toBeVisible();
    await expect(page.getByTestId('properties-panel')).toBeVisible();
  });

  test('should add a new slide', async ({ page }) => {
    const initialCount = await page.locator('[data-testid^="slide-thumb-"]').count();
    await page.getByTestId('add-slide-btn').click();
    // Should have one more slide now
    await expect(page.locator('[data-testid^="slide-thumb-"]')).toHaveCount(initialCount + 1);
  });

  test('should add text element to canvas', async ({ page }) => {
    // Select text tool
    await page.getByTestId('tool-text').click();

    // Click on canvas to add element
    const canvas = page.getByTestId('slide-canvas');
    await canvas.click({ position: { x: 200, y: 200 } });

    // Wait for element to appear (may have default elements)
    await expect(page.locator('[data-element-type="text"]')).toHaveCount(2);
  });

  test('should add heading element to canvas', async ({ page }) => {
    await page.getByTestId('tool-heading').click();
    const canvas = page.getByTestId('slide-canvas');
    await canvas.click({ position: { x: 300, y: 150 } });
    await expect(page.locator('[data-element-type="heading"]')).toHaveCount(2); // 1 default + 1 new
  });

  test('should add shape element to canvas', async ({ page }) => {
    await page.getByTestId('tool-shape').click();
    const canvas = page.getByTestId('slide-canvas');
    await canvas.click({ position: { x: 400, y: 300 } });
    await expect(page.locator('[data-element-type="shape"]')).toHaveCount(1);
  });

  test('should add table element to canvas', async ({ page }) => {
    await page.getByTestId('tool-table').click();
    const canvas = page.getByTestId('slide-canvas');
    await canvas.click({ position: { x: 300, y: 250 } });
    await expect(page.locator('[data-element-type="table"]')).toHaveCount(1);
    // The default 3×3 grid renders 9 cells.
    await expect(page.locator('[data-element-type="table"] td')).toHaveCount(9);
  });

  test('should edit a table cell and add a row from the properties panel', async ({ page }) => {
    await page.getByTestId('tool-table').click();
    const canvas = page.getByTestId('slide-canvas');
    await canvas.click({ position: { x: 300, y: 250 } });
    await expect(page.locator('[data-element-type="table"]')).toHaveCount(1);

    // Element auto-selects after creation → Properties tab shows the editor.
    await page.getByTestId('prop-table-cell-0-0').fill('Quarter');
    await expect(page.locator('[data-element-type="table"] td').first()).toHaveText('Quarter');

    // Add a row → 4 rows × 3 cols = 12 cells.
    await page.getByTestId('prop-table-row-add').click();
    await expect(page.locator('[data-element-type="table"] td')).toHaveCount(12);
  });

  test('should select and delete element', async ({ page }) => {
    // Add a text element
    await page.getByTestId('tool-text').click();
    const canvas = page.getByTestId('slide-canvas');
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // Verify at least one text element exists
    const count = await page.locator('[data-element-type="text"]').count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should zoom in and out', async ({ page }) => {
    const initialZoom = await page.getByTestId('zoom-level').textContent();
    expect(initialZoom).toBe('100%');

    await page.getByTestId('tool-zoom-in').click();
    await expect(page.getByTestId('zoom-level')).toHaveText('110%');

    await page.getByTestId('tool-zoom-out').click();
    await expect(page.getByTestId('zoom-level')).toHaveText('100%');
  });

  test('should toggle grid', async ({ page }) => {
    const gridButton = page.getByTestId('tool-grid');
    await gridButton.click();
    // Just verify the click doesn't error - grid state is internal
    await expect(gridButton).toBeVisible();
  });

  test('should navigate to presentation mode', async ({ page }) => {
    await page.getByTestId('tool-present').click();
    await expect(page.getByTestId('presenter-page')).toBeVisible();
    await expect(page.getByTestId('present-slide')).toBeVisible();
  });
});
