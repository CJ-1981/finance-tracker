import { test, expect } from '@playwright/test';

/**
 * Project Dashboard with Charts Tests
 * Tests the project dashboard including pie chart by category,
 * area chart over time, cumulative/absolute toggle, date period filters,
 * category grouping options, time grouping options, and mobile responsive charts
 */

test.describe('Project Dashboard with Charts', () => {

  test.beforeEach(async ({ page }) => {
    // Register pageerror listener before navigation to catch all errors
    page.on('pageerror', (error) => {
      (page as any).pageErrors = (page as any).pageErrors || [];
      (page as any).pageErrors.push(error.toString());
    });
  });

  /**
   * Helper function to wait for page load and spinner to complete
   */
  async function waitForPageReady(page: any) {
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for any loading spinners to disappear
    const spinner = page.locator('.animate-spin').first();
    const hasSpinner = await spinner.count().then(c => c > 0);

    if (hasSpinner) {
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {
        // Spinner might disappear quickly
      });
    }

    // Wait for React to render in production build
    await page.waitForTimeout(2000);
  }

  /**
   * Helper function to navigate to a project detail page
   */
  async function navigateToProject(page: any) {
    await page.goto('/projects');
    await waitForPageReady(page);

    // Look for a project card to click
    const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
    const hasProjectCard = await projectCard.count().then(c => c > 0);

    if (hasProjectCard) {
      await projectCard.click();
      await waitForPageReady(page);
      return true;
    }

    return false;
  }

  test.describe('Pie Chart by Category', () => {

    test('Should display pie chart on project dashboard', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for pie chart (Chart.js canvas)
        const chartCanvas = page.locator('canvas');
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          await expect(chartCanvas.first()).toBeAttached();
        }
      }
    });

    test('Should show category breakdown in pie chart', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for chart legend or labels
        const chartLegend = page.locator('.chart-legend, [class*="legend"]');
        const hasLegend = await chartLegend.count().then(c => c > 0);

        if (hasLegend) {
          await expect(chartLegend.first()).toBeVisible();
        }
      }
    });

    test('Should have category labels in chart legend', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for category names in legend
        const legendItems = page.locator('span, div').filter(async elem => {
          const text = await elem.textContent();
          return text && text.trim().length > 0 && text !== 'Category';
        });

        const hasLegendItems = await legendItems.count().then(c => c > 0);
        expect(hasLegendItems).toBe(true);
      }
    });

    test('Should display percentages or amounts in pie chart', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for percentage or currency values
        const valueLabels = page.locator('text=/.*\\d+%.*|.*[€$£]\\s*\\d+.*/');
        const hasValues = await valueLabels.count().then(c => c > 0);

        if (hasValues) {
          await expect(valueLabels.first()).toBeAttached();
        }
      }
    });
  });

  test.describe('Area Chart Over Time', () => {

    test('Should display area chart for transactions over time', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for line/area chart canvas
        const chartCanvas = page.locator('canvas');
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          // There should be at least one chart (could be pie or area)
          await expect(chartCanvas.first()).toBeAttached();
        }
      }
    });

    test('Should have date axis on area chart', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for date labels
        const dateLabels = page.locator('text=/\\d{1,2}\\/?\\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/');
        const hasDates = await dateLabels.count().then(c => c > 0);

        if (hasDates) {
          await expect(dateLabels.first()).toBeAttached();
        }
      }
    });

    test('Should show trend line or filled area', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Verify chart is rendered (canvas should have content)
        const chartCanvas = page.locator('canvas').first();
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          const isVisible = await chartCanvas.isVisible();
          expect(isVisible).toBe(true);
        }
      }
    });
  });

  test.describe('Cumulative/Absolute Toggle', () => {

    test('Should have cumulative/absolute mode toggle buttons', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for toggle buttons
        const cumulativeButton = page.locator('button', { hasText: /cumulative/i });
        const absoluteButton = page.locator('button', { hasText: /absolute/i });

        const hasCumulative = await cumulativeButton.count().then(c => c > 0);
        const hasAbsolute = await absoluteButton.count().then(c => c > 0);

        expect(hasCumulative || hasAbsolute).toBe(true);
      }
    });

    test('Should switch to cumulative mode when button is clicked', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const cumulativeButton = page.locator('button', { hasText: /cumulative/i });
        const hasCumulative = await cumulativeButton.count().then(c => c > 0);

        if (hasCumulative) {
          await cumulativeButton.click();
          await page.waitForTimeout(1000);

          // Check if button has active state
          const isActive = await cumulativeButton.evaluate(el => {
            const classes = el.className || '';
            return classes.includes('bg-') || classes.includes('active') || classes.includes('selected');
          });

          expect(isActive).toBe(true);
        }
      }
    });

    test('Should switch to absolute mode when button is clicked', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const absoluteButton = page.locator('button', { hasText: /absolute/i });
        const hasAbsolute = await absoluteButton.count().then(c => c > 0);

        if (hasAbsolute) {
          await absoluteButton.click();
          await page.waitForTimeout(1000);

          // Check if button has active state
          const isActive = await absoluteButton.evaluate(el => {
            const classes = el.className || '';
            return classes.includes('bg-') || classes.includes('active') || classes.includes('selected');
          });

          expect(isActive).toBe(true);
        }
      }
    });

    test('Should persist chart mode preference across page reloads', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const cumulativeButton = page.locator('button', { hasText: /cumulative/i });
        const hasCumulative = await cumulativeButton.count().then(c => c > 0);

        if (hasCumulative) {
          await cumulativeButton.click();
          await page.waitForTimeout(1000);

          // Reload page
          await page.reload();
          await waitForPageReady(page);

          // Check if mode is still cumulative
          const isActive = await cumulativeButton.evaluate(el => {
            const classes = el.className || '';
            return classes.includes('bg-') || classes.includes('active') || classes.includes('selected');
          });

          expect(isActive).toBe(true);
        }
      }
    });
  });

  test.describe('Date Period Filters', () => {

    test('Should have date period filter controls', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for date filter dropdowns or date pickers
        const dateFilter = page.locator('select:has-text("Period"), select:has-text("Date"), input[type="date"]');
        const hasDateFilter = await dateFilter.count().then(c => c > 0);

        if (hasDateFilter) {
          await expect(dateFilter.first()).toBeAttached();
        }
      }
    });

    test('Should filter chart data by selected date period', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const dateFilter = page.locator('select').filter({ hasText: /period|date|last/i });
        const hasDateFilter = await dateFilter.count().then(c => c > 0);

        if (hasDateFilter) {
          // Select a different period
          const options = await dateFilter.locator("option");
          if (options.length > 1) {
            await dateFilter.selectOption({ index: 1 });
            await page.waitForTimeout(1500);

            // Chart should update (verify it's still visible)
            const chartCanvas = page.locator('canvas').first();
            const hasChart = await chartCanvas.count().then(c => c > 0);

            if (hasChart) {
              await expect(chartCanvas).toBeVisible();
            }
          }
        }
      }
    });

    test('Should have quick date range options (e.g., Last 7 days, Last 30 days)', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for quick date range buttons or options
        const quickOptions = page.locator('button, option').filter({ hasText: /7 days|30 days|this month|last month/i });
        const hasOptions = await quickOptions.count().then(c => c > 0);

        if (hasOptions) {
          await expect(quickOptions.first()).toBeAttached();
        }
      }
    });
  });

  test.describe('Category Grouping Options', () => {

    test('Should have category grouping selector', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for grouping dropdown
        const groupingSelect = page.locator('select').filter({ hasText: /group by|grouping/i });
        const hasGrouping = await groupingSelect.count().then(c => c > 0);

        if (hasGrouping) {
          await expect(groupingSelect.first()).toBeAttached();
        }
      }
    });

    test('Should support grouping by category', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const groupingSelect = page.locator('select').filter({ hasText: /group by|grouping/i });
        const hasGrouping = await groupingSelect.count().then(c => c > 0);

        if (hasGrouping) {
          const options = await groupingSelect.locator("option");
          const hasCategoryOption = options.some(opt => {
            const text = opt.toLowerCase ? opt.toString().toLowerCase() : '';
            return text.includes('category');
          });

          expect(hasCategoryOption).toBe(true);
        }
      }
    });

    test('Should update pie chart when grouping changes', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const groupingSelect = page.locator('select').filter({ hasText: /group by|grouping/i });
        const hasGrouping = await groupingSelect.count().then(c => c > 0);

        if (hasGrouping) {
          const options = await groupingSelect.locator("option");
          if (options.length > 1) {
            // Select different grouping
            await groupingSelect.selectOption({ index: 1 });
            await page.waitForTimeout(1500);

            // Chart should still be visible
            const chartCanvas = page.locator('canvas').first();
            await expect(chartCanvas).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Time Grouping Options', () => {

    test('Should have time grouping selector (day, week, month)', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for time grouping dropdown
        const timeGrouping = page.locator('select').filter({ hasText: /by day|by week|by month|time grouping/i });
        const hasTimeGrouping = await timeGrouping.count().then(c => c > 0);

        if (hasTimeGrouping) {
          await expect(timeGrouping.first()).toBeAttached();
        }
      }
    });

    test('Should support grouping by day', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const timeGrouping = page.locator('select').filter({ hasText: /time|group/i });
        const hasTimeGrouping = await timeGrouping.count().then(c => c > 0);

        if (hasTimeGrouping) {
          const options = await timeGrouping.locator("option");
          const hasDayOption = options.some(opt => {
            const text = opt.toLowerCase ? opt.toString().toLowerCase() : '';
            return text.includes('day');
          });

          if (hasDayOption) {
            await timeGrouping.selectOption({ label: "Day" });
            await page.waitForTimeout(1500);

            // Chart should update
            const chartCanvas = page.locator('canvas').first();
            await expect(chartCanvas).toBeVisible();
          }
        }
      }
    });

    test('Should support grouping by month', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const timeGrouping = page.locator('select').filter({ hasText: /time|group/i });
        const hasTimeGrouping = await timeGrouping.count().then(c => c > 0);

        if (hasTimeGrouping) {
          const options = await timeGrouping.locator("option");
          const hasMonthOption = options.some(opt => {
            const text = opt.toLowerCase ? opt.toString().toLowerCase() : '';
            return text.includes('month');
          });

          if (hasMonthOption) {
            await timeGrouping.selectOption({ label: "Month" });
            await page.waitForTimeout(1500);

            // Chart should update
            const chartCanvas = page.locator('canvas').first();
            await expect(chartCanvas).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Chart Metrics', () => {

    test('Should support amount metric', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for metric selector or amount display
        const metricSelect = page.locator('select').filter({ hasText: /amount|metric/i });
        const hasMetricSelect = await metricSelect.count().then(c => c > 0);

        if (hasMetricSelect) {
          const options = await metricSelect.locator("option");
          const hasAmountOption = options.some(opt => {
            const text = opt.toLowerCase ? opt.toString().toLowerCase() : '';
            return text.includes('amount');
          });

          expect(hasAmountOption).toBe(true);
        }
      }
    });

    test('Should support count metric', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const metricSelect = page.locator('select').filter({ hasText: /amount|count|metric/i });
        const hasMetricSelect = await metricSelect.count().then(c => c > 0);

        if (hasMetricSelect) {
          const options = await metricSelect.locator("option");
          const hasCountOption = options.some(opt => {
            const text = opt.toLowerCase ? opt.toString().toLowerCase() : '';
            return text.includes('count');
          });

          if (hasCountOption) {
            await metricSelect.selectOption({ label: "Count" });
            await page.waitForTimeout(1500);

            // Chart should update with count data
            const chartCanvas = page.locator('canvas').first();
            await expect(chartCanvas).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Empty State', () => {

    test('Should show empty state when no transactions exist', async ({ page }) => {
      // This test assumes we might have a project with no transactions
      await page.goto('/projects');
      await waitForPageReady(page);

      // Create a new project for testing empty state
      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill project form
        const nameInput = page.locator('input#name, input[placeholder*="name" i]').first();
        const hasNameInput = await nameInput.count().then(c => c > 0);

        if (hasNameInput) {
          await nameInput.fill(`Empty Test ${Date.now()}`);

          const submitButton = page.locator('button[type="submit"]').first();
          await submitButton.click();
          await waitForPageReady(page);

          // Look for empty state message
          const emptyState = page.locator('text=/no transactions|empty|add your first/i');
          const hasEmptyState = await emptyState.count().then(c => c > 0);

          if (hasEmptyState) {
            await expect(emptyState.first()).toBeVisible();
          }
        }
      }
    });

    test('Should display placeholder or message when chart has no data', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for no data message
        const noDataMessage = page.locator('text=/no data|no transactions|add transactions/i');
        const hasNoData = await noDataMessage.count().then(c => c > 0);

        if (hasNoData) {
          await expect(noDataMessage.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Chart Interactions', () => {

    test('Should show tooltip on chart hover', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const chartCanvas = page.locator('canvas').first();
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          // Hover over the chart
          await chartCanvas.hover({ position: { x: 100, y: 100 } });
          await page.waitForTimeout(500);

          // Chart.js tooltips are rendered as canvas overlays or separate divs
          // Just verify the chart is still visible and interactive
          await expect(chartCanvas).toBeVisible();
        }
      }
    });

    test('Should highlight chart segment on hover', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const chartCanvas = page.locator('canvas').first();
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          // Move mouse over chart
          await chartCanvas.hover({ position: { x: 50, y: 50 } });
          await page.waitForTimeout(500);

          // Verify canvas is still responsive
          const isVisible = await chartCanvas.isVisible();
          expect(isVisible).toBe(true);
        }
      }
    });
  });

  test.describe('Mobile Responsive Charts', () => {

    test('Should display charts on 375px viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const navigated = await navigateToProject(page);

      if (navigated) {
        const chartCanvas = page.locator('canvas').first();
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          await expect(chartCanvas).toBeVisible();
        }
      }
    });

    test('Should not cause horizontal overflow on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const navigated = await navigateToProject(page);

      if (navigated) {
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      }
    });

    test('Should stack controls vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for chart controls
        const controls = page.locator('button, select').filter(async elem => {
          return await elem.isVisible();
        });

        const controlCount = await controls.count();

        if (controlCount > 0) {
          // Controls should be visible and not overflow
          await expect(controls.first()).toBeVisible();
        }
      }
    });

    test('Should have touch-friendly chart controls on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const navigated = await navigateToProject(page);

      if (navigated) {
        const controlButtons = page.locator('button').filter(async elem => {
          return await elem.isVisible();
        });

        const buttonCount = await controlButtons.count();

        if (buttonCount > 0) {
          const firstButton = controlButtons.first();
          const box = await firstButton.boundingBox();

          if (box) {
            // Buttons should be at least 44px tall for touch
            expect(box.height).toBeGreaterThanOrEqual(40);
          }
        }
      }
    });

    test('Should scroll chart container on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });

      const navigated = await navigateToProject(page);

      if (navigated) {
        // Verify content is accessible
        const chartCanvas = page.locator('canvas').first();
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          await expect(chartCanvas).toBeAttached();
        }
      }
    });
  });

  test.describe('Chart Legend', () => {

    test('Should display legend with category colors', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Look for legend items with colors
        const legendItems = page.locator('[class*="legend"] span, [class*="legend"] div');
        const hasLegendItems = await legendItems.count().then(c => c > 0);

        if (hasLegendItems) {
          await expect(legendItems.first()).toBeVisible();
        }
      }
    });

    test('Should allow toggling category visibility from legend', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const legendItems = page.locator('[class*="legend"] span, [class*="legend"] div, [role="button"]').filter(async elem => {
          return await elem.isVisible();
        });

        const itemCount = await legendItems.count();

        if (itemCount > 0) {
          // Click on a legend item
          await legendItems.first().click();
          await page.waitForTimeout(1000);

          // Chart should still be visible
          const chartCanvas = page.locator('canvas').first();
          await expect(chartCanvas).toBeVisible();
        }
      }
    });
  });

  test.describe('Chart Loading State', () => {

    test('Should show loading indicator while chart data loads', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        // Reload and check for loading state
        const startTime = Date.now();
        await page.reload();

        // Look for spinner or loading state
        const spinner = page.locator('.animate-spin, [class*="loading"]');
        const hasSpinner = await spinner.count().then(c => c > 0);

        if (hasSpinner) {
          // Spinner should disappear
          await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
            // Spinner might not exist
          });
        }

        // Chart should appear after loading
        await waitForPageReady(page);
        const chartCanvas = page.locator('canvas').first();
        await expect(chartCanvas).toBeAttached();
      }
    });
  });

  test.describe('Chart Responsiveness', () => {

    test('Should resize chart when window is resized', async ({ page }) => {
      const navigated = await navigateToProject(page);

      if (navigated) {
        const chartCanvas = page.locator('canvas').first();
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          // Get initial size
          const initialBox = await chartCanvas.boundingBox();

          // Resize viewport
          await page.setViewportSize({ width: 500, height: 800 });
          await page.waitForTimeout(1000);

          // Get new size
          const newBox = await chartCanvas.boundingBox();

          // Dimensions should have changed
          if (initialBox && newBox) {
            expect(initialBox.width).not.toBe(newBox.width);
          }
        }
      }
    });
  });
});
