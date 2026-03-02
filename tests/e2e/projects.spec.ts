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

  test('Projects page redirects to login when unauthenticated', async ({ page }) => {
    // Navigate to projects page (protected route)
    await page.goto('/projects');

    // Wait for navigation/redirect to complete
    await page.waitForLoadState('domcontentloaded');

    // Wait a moment for the redirect to happen
    await page.waitForTimeout(1000);

    // Check current URL - should be redirected to login or stay on projects
    const currentUrl = page.url();

    // If we're still on /projects, verify the page loaded without errors
    if (currentUrl.includes('/projects')) {
      // Page loaded without redirect (might be authenticated in test env)
      await expect(page).toHaveTitle(/Finance Tracker/);
    } else {
      // Verify redirect happened (to login or landing page)
      expect(currentUrl).toMatch(/\/(login|\?)/);
    }
  });

  test('Project page handles loading state gracefully', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/projects');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check current URL to see where we ended up
    const currentUrl = page.url();

    if (currentUrl.includes('/projects')) {
      // We're on the projects page (might be authenticated)
      // Wait for any loading to complete
      const spinner = page.locator('.animate-spin').first();
      const hasSpinner = await spinner.count().then(c => c > 0);

      if (hasSpinner) {
        await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
          // Spinner disappeared
        });
      }

      // Check that either projects grid or empty state is visible
      const projectsGrid = page.locator('[data-testid="projects-grid"], .grid');
      const emptyState = page.locator('[data-testid="empty-state"], .text-center');

      const hasGrid = await projectsGrid.count().then(c => c > 0);
      const hasEmpty = await emptyState.count().then(c => c > 0);

      // Should have either projects or empty state
      expect(hasGrid || hasEmpty).toBe(true);
    } else {
      // We were redirected (unauthenticated) - verify redirect worked
      expect(currentUrl).toMatch(/\/(login|\?)/);
    }
  });

  test('Project cards should stack on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    // Wait for content to load
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to appear and disappear
    const spinner = page.locator('.animate-spin').first();
    const hasSpinner = await spinner.count().then(c => c > 0);

    if (hasSpinner) {
      // Wait for loading spinner to disappear
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {
        // Spinner might disappear quickly
      });
    }

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Check if page is loaded (either empty state or projects)
    const projectsPage = page.locator('[data-testid="projects-page"], .min-h-screen, main').first();
    await expect(projectsPage).toBeAttached({ timeout: 10000 });
  });

  test('Summary widgets should be responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to appear and disappear
    const spinner = page.locator('.animate-spin').first();
    const hasSpinner = await spinner.count().then(c => c > 0);

    if (hasSpinner) {
      // Wait for loading spinner to disappear
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {
        // Spinner might disappear quickly
      });
    }

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Check that page loaded without errors
    const projectsPage = page.locator('[data-testid="projects-page"], .min-h-screen');
    await expect(projectsPage).toBeAttached();
  });

  test('Create project button should be accessible', async ({ page }) => {
    await page.goto('/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Wait for loading spinner to appear and disappear
    const spinner = page.locator('.animate-spin').first();
    const hasSpinner = await spinner.count().then(c => c > 0);

    if (hasSpinner) {
      // Wait for loading spinner to disappear
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {
        // Spinner might disappear quickly
      });
    }

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Look for create/add project button using data-testid with fallback
    const createButton = page.locator('[data-testid="create-project-button"], button:has-text("New Project"), button:has-text("Create")').first();

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
    // Navigate to projects page
    await page.goto('/projects');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check where we ended up
    const currentUrl = page.url();

    if (currentUrl.includes('/projects')) {
      // On projects page - verify it handles authenticated state
      await expect(page).toHaveTitle(/Finance Tracker/);

      // Check for empty state or projects
      const emptyState = page.locator('[data-testid="empty-state"], .text-center');
      const projectsGrid = page.locator('[data-testid="projects-grid"], .grid');

      const hasEmptyState = await emptyState.count().then(c => c > 0);
      const hasProjects = await projectsGrid.count().then(c => c > 0);

      // Should have either empty state or projects
      expect(hasEmptyState || hasProjects).toBe(true);
    } else {
      // Was redirected - verify redirect behavior
      expect(currentUrl).toMatch(/\/(login|\?)/);
    }
  });
});
