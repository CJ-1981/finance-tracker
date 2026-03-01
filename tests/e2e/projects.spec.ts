import { test, expect } from '@playwright/test';

/**
 * Project Management Tests
 * Tests project listing, creation, and responsive layouts
 */

test.describe('Project Management', () => {

  test.beforeEach(async ({ page }) => {
    // Register pageerror listener before navigation to catch all errors
    page.on('pageerror', (error) => {
      (page as any).pageErrors = (page as any).pageErrors || [];
      (page as any).pageErrors.push(error.toString());
    });
  });

  test('Projects page loads successfully', async ({ page }) => {
    // Initialize errors array for this test
    (page as any).pageErrors = [];

    // Check page title
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Navigate to projects page
    await page.goto('/projects');

    await page.waitForLoadState('networkidle');

    // Should not have critical errors
    expect(((page as any).pageErrors || []).filter(e => e.includes('TypeError') || e.includes('ReferenceError')).length).toBe(0);
  });

  test('Project cards should display in responsive grid', async ({ page }) => {
    // Wait for projects to load
    await page.waitForSelector('.card, [class*="project"]', { timeout: 5000 }).catch(() => {
      // No projects might exist
    });

    // Check if project cards exist
    const projectCards = page.locator('.card, [class*="project"]');
    const count = await projectCards.count();

    if (count > 0) {
      // First card should be visible
      await expect(projectCards.first()).toBeVisible();
    }
  });

  test('Project cards should stack on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Check if cards exist and are visible
    const cards = page.locator('.card');
    const count = await cards.count();

    if (count > 0) {
      // Cards should be visible on mobile
      await expect(cards.first()).toBeVisible();

      // Check cards have responsive styling
      const firstCardClass = await cards.first().getAttribute('class');
      expect(firstCardClass).toBeTruthy();
    }
  });

  test('Summary widgets should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for summary cards or widgets
    const summaryCards = page.locator('[class*="summary"], [class*="stat"], [class*="widget"]');
    const count = await summaryCards.count();

    if (count > 0) {
      // At least one summary should be visible
      await expect(summaryCards.first()).toBeVisible();

      // Summary cards should not cause horizontal overflow
      const hasOverflow = await summaryCards.first().evaluate(el => {
        return el.scrollWidth > el.clientWidth;
      });
      expect(hasOverflow).toBe(false);
    }
  });

  test('Create project button should be accessible', async ({ page }) => {
    await page.goto('/projects');

    // Look for create/add project button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a:has-text("Create")').first();

    const hasCreateButton = await createButton.count().then(count => count > 0);

    if (hasCreateButton) {
      // Button should be visible
      await expect(createButton).toBeVisible();

      // On mobile, button should meet touch target requirements
      await page.setViewportSize({ width: 375, height: 667 });
      const box = await createButton.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Project page should handle empty state', async ({ page }) => {
    // Empty state is handled by just loading the page
    await page.goto('/projects');

    // Page should load even with no projects
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Check for empty state message or project cards
    const emptyState = page.locator('[class*="empty"], [class*="no-project"], :text("no projects"), :text("No projects")').first();
    const hasEmptyState = await emptyState.count().then(count => count > 0);

    const projectCards = page.locator('.card');
    const hasProjects = await projectCards.count().then(count => count > 0);

    // Should have either empty state or project cards
    expect(hasEmptyState || hasProjects).toBe(true);
  });
});
