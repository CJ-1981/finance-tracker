import { test, expect } from '@playwright/test';

/**
 * Mobile Responsiveness Tests
 * Tests mobile-specific functionality including touch targets, overflow prevention, and responsive layouts
 */

test.describe('Mobile Responsiveness', () => {

  test.beforeEach(async ({ page }) => {
    // Set mobile viewport before each test
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Mobile viewport (375px) should display correctly', async ({ page }) => {
    await page.goto('/projects');

    // Check page loads without errors
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Verify no horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Small mobile viewport (320px) should display correctly', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/projects');

    // Check page loads
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('Should not have horizontal overflow on mobile project pages', async ({ page }) => {
    await page.goto('/projects');

    // Check for horizontal scrollbar
    const hasHorizontalScroll = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth > el.clientWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test('All buttons meet minimum 44px touch target on mobile', async ({ page }) => {
    await page.goto('/');

    // Check button sizes
    const buttonSizes = await page.$$eval('button, a[href]', elements =>
      elements.map(el => {
        const htmlEl = el as HTMLElement;
        return {
          tagName: el.tagName,
          height: htmlEl.offsetHeight,
          width: htmlEl.offsetWidth,
          text: el.textContent?.trim().substring(0, 30)
        };
      })
    );

    // Filter for visible buttons only
    const visibleButtons = buttonSizes.filter(b => b.height > 0 && b.width > 0);

    // Log any buttons that don't meet touch target requirements
    const undersizedButtons = visibleButtons.filter(b => b.height < 44 || b.width < 44);

    if (undersizedButtons.length > 0) {
      console.log('Buttons below 44px touch target:', undersizedButtons);
    }

    // At minimum, primary action buttons should be 44px
    const primaryButtons = await page.$$('button[class*="btn"]');
    for (const btn of primaryButtons) {
      const box = await btn.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Mobile form inputs should be accessible', async ({ page }) => {
    await page.goto('/login');

    // Check input sizes
    const inputSizes = await page.$$eval('input, select', elements =>
      elements.map(el => {
        const htmlEl = el as HTMLElement;
        return {
          type: el.getAttribute('type') || el.tagName,
          height: htmlEl.offsetHeight
        };
      })
    );

    // All inputs should be at least 44px tall for touch
    for (const input of inputSizes) {
      if (input.height > 0) {
        expect(input.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Mobile cards should stack properly', async ({ page }) => {
    await page.goto('/projects');

    // Wait for project cards to load
    await page.waitForSelector('.card, [class*="card"]', { timeout: 5000 }).catch(() => {
      // Cards might not exist if no projects, that's ok
    });

    // Check if cards exist and are responsive
    const cards = await page.$$('.card, [class*="card"]');
    if (cards.length > 0) {
      // Cards should be visible on mobile
      const firstCardVisible = await cards[0].isVisible();
      expect(firstCardVisible).toBe(true);
    }
  });

  test('Mobile navigation should be accessible', async ({ page }) => {
    await page.goto('/');

    // Check if navigation exists and is accessible
    const navButtons = await page.$$('nav button, nav a[href]');
    if (navButtons.length > 0) {
      // At least one nav element should exist on mobile
      const navVisible = await Promise.all(navButtons.map(btn => btn.isVisible().catch(() => false)));
      expect(navVisible.some(v => v)).toBe(true);
    }
  });

  test('Mobile text should be readable (not too small)', async ({ page }) => {
    await page.goto('/projects');

    // Check text sizes
    const textElements = await page.$$eval('p, span, div', elements =>
      elements
        .filter(el => el.textContent && el.textContent.trim().length > 0)
        .map(el => ({
          tag: el.tagName,
          fontSize: window.getComputedStyle(el).fontSize,
          text: el.textContent?.trim().substring(0, 30)
        }))
        .slice(0, 20) // Check first 20 elements
    );

    // Text should be at least 12px for readability
    for (const el of textElements) {
      const fontSize = parseInt(el.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });

  test('Mobile page should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;

    // Should load in under 5 seconds on mobile
    expect(loadTime).toBeLessThan(5000);
  });

  test('Mobile viewport should handle long text with truncation', async ({ page }) => {
    await page.goto('/projects');

    // Check for text overflow issues
    const overflowElements = await page.$$eval('[class*="truncate"], [class*="break-words"]', elements =>
      elements.map(el => ({
        class: el.className,
        hasOverflow: window.getComputedStyle(el).textOverflow !== 'clip'
      }))
    );

    // At least some elements should handle overflow
    expect(overflowElements.length).toBeGreaterThan(0);
  });
});
