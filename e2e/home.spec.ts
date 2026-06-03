import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display app title and create new deck', async ({ page }) => {
    await page.goto('/');
    
    // Check app title
    await expect(page.getByTestId('app-title')).toHaveText('MyDecks');
    
    // Check empty state or decks grid
    const emptyState = page.getByTestId('empty-state');
    const decksGrid = page.getByTestId('decks-grid');
    await expect(emptyState.or(decksGrid)).toBeVisible();
  });

  test('should create a new deck and navigate to editor', async ({ page }) => {
    await page.goto('/');
    
    // Click new deck button and wait for dialog
    await page.getByTestId('new-deck-btn').click();
    await expect(page.getByTestId('deck-title-input')).toBeVisible();
    
    // Fill in deck title
    await page.getByTestId('deck-title-input').fill('Test Presentation');
    await page.getByTestId('create-deck-btn').click();
    
    // Should navigate to editor
    await expect(page).toHaveURL(/\/editor\/.+/);
    await expect(page.getByTestId('editor-page')).toBeVisible();
  });
});
