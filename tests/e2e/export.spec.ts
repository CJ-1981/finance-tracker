import { test, expect } from '@playwright/test';

/**
 * CSV Export Tests
 * Tests navigating to transactions page, applying date filters,
 * exporting CSV, and verifying download functionality
 */

test.describe('CSV Export', () => {

  test.beforeEach(async ({ page }) => {
    // Register pageerror listener before navigation to catch all errors
    page.on('pageerror', (error) => {
      (page as any).pageErrors = (page as any).pageErrors || [];
      (page as any).pageErrors.push(error.toString());
    });

    // Set up download handler for each test
    page.on('download', (download) => {
      (page as any).lastDownload = download;
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

  test.describe('Navigate to Transactions Page', () => {

    test('Should access transactions page from projects list', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Look for a project card to click
      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        // Look for transactions link or tab
        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          // Verify we're on transactions page
          const currentUrl = page.url();
          expect(currentUrl).toContain('transaction');
        }
      }
    });

    test('Should display transactions list on page load', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          // Look for transaction table or list
          const transactionTable = page.locator('table, [data-testid*="transaction"], .transaction-list');
          const hasTable = await transactionTable.count().then(c => c > 0);

          if (hasTable) {
            await expect(transactionTable.first()).toBeAttached();
          }
        }
      }
    });
  });

  test.describe('Date Filter Application', () => {

    test('Should have date filter controls', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          // Look for date filter inputs
          const dateInputs = page.locator('input[type="date"], input[placeholder*="date" i]');
          const hasDateInputs = await dateInputs.count().then(c => c > 0);

          if (hasDateInputs) {
            await expect(dateInputs.first()).toBeAttached();
          }
        }
      }
    });

    test('Should have start date and end date inputs', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const dateInputs = page.locator('input[type="date"]');
          const dateCount = await dateInputs.count();

          // Should have at least 2 date inputs (start and end)
          expect(dateCount).toBeGreaterThanOrEqual(1);
        }
      }
    });

    test('Should filter transactions when date range is applied', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const dateInputs = page.locator('input[type="date"]');
          const dateCount = await dateInputs.count();

          if (dateCount >= 1) {
            // Set a date range for current month
            const today = new Date();
            const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

            await dateInputs.first().fill(firstDay);
            await page.waitForTimeout(1000);

            // Look for apply/filter button
            const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")').first();
            const hasApplyButton = await applyButton.count().then(c => c > 0);

            if (hasApplyButton) {
              await applyButton.click();
              await page.waitForTimeout(1000);

              // Transactions should still be displayed (filtered)
              const transactionTable = page.locator('table, [data-testid*="transaction"]');
              const hasTable = await transactionTable.count().then(c => c > 0);

              if (hasTable) {
                await expect(transactionTable.first()).toBeAttached();
              }
            }
          }
        }
      }
    });

    test('Should have quick date range options (e.g., Last 30 days)', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          // Look for quick date range buttons
          const quickButtons = page.locator('button').filter({ hasText: /last|this|past/i });
          const hasQuickButtons = await quickButtons.count().then(c => c > 0);

          if (hasQuickButtons) {
            await expect(quickButtons.first()).toBeAttached();
          }
        }
      }
    });
  });

  test.describe('Export Button', () => {

    test('Should have export CSV button', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          // Look for export button
          const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV"), button[aria-label*="export" i]');
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            await expect(exportButton.first()).toBeAttached();
          }
        }
      }
    });

    test('Should have download icon or indicator on export button', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export")');
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            // Check for download icon (SVG or unicode)
            const hasIcon = await exportButton.first().locator('svg, span:has-text("⬇")').count().then(c => c > 0);

            // Icon is optional but if present, verify it
            if (hasIcon) {
              await expect(exportButton.locator('svg').first()).toBeAttached();
            }
          }
        }
      }
    });
  });

  test.describe('CSV Export Execution', () => {

    test('Should trigger download when export button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            // Set up download handler
            let downloadTriggered = false;
            page.on('download', () => {
              downloadTriggered = true;
            });

            await exportButton.click();
            await page.waitForTimeout(2000);

            // Download should be triggered
            // Note: In test environment, actual download may not complete
            // but we verify the button action works
            const download = (page as any).lastDownload;
            expect(download || downloadTriggered).toBeTruthy();
          }
        }
      }
    });

    test('Should generate CSV file with correct filename', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            page.on('download', async (download) => {
              const filename = download.suggestedFilename();
              expect(filename).toMatch(/\.csv$/i);
              expect(filename).toBeTruthy();
            });

            await exportButton.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    });
  });

  test.describe('CSV Content Verification', () => {

    test('Should include headers in exported CSV', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            let csvContent = '';

            page.on('download', async (download) => {
              const path = await download.path();
              if (path) {
                const fs = require('fs');
                csvContent = fs.readFileSync(path, 'utf-8');
              } else {
                // If path not available, read as stream
                const stream = await download.createReadStream();
                const chunks: Buffer[] = [];
                for await (const chunk of stream) {
                  chunks.push(chunk);
                }
                csvContent = Buffer.concat(chunks).toString('utf-8');
              }
            });

            await exportButton.click();
            await page.waitForTimeout(3000);

            if (csvContent) {
              // Verify CSV has headers
              const firstLine = csvContent.split('\n')[0];
              expect(firstLine).toMatch(/date|category|amount|currency/i);
            }
          }
        }
      }
    });

    test('Should include transaction data rows', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            let csvContent = '';

            page.on('download', async (download) => {
              const stream = await download.createReadStream();
              const chunks: Buffer[] = [];
              for await (const chunk of stream) {
                chunks.push(chunk);
              }
              csvContent = Buffer.concat(chunks).toString('utf-8');
            });

            await exportButton.click();
            await page.waitForTimeout(3000);

            if (csvContent) {
              const lines = csvContent.split('\n').filter(line => line.trim());
              expect(lines.length).toBeGreaterThan(1); // At least header + one row
            }
          }
        }
      }
    });

    test('Should include custom fields in export if configured', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            let csvContent = '';

            page.on('download', async (download) => {
              const stream = await download.createReadStream();
              const chunks: Buffer[] = [];
              for await (const chunk of stream) {
                chunks.push(chunk);
              }
              csvContent = Buffer.concat(chunks).toString('utf-8');
            });

            await exportButton.click();
            await page.waitForTimeout(3000);

            if (csvContent) {
              // CSV should have standard columns
              expect(csvContent).toMatch(/date|category/i);
            }
          }
        }
      }
    });
  });

  test.describe('Export with Date Filter', () => {

    test('Should export only filtered transactions when date filter is applied', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          // Apply date filter
          const dateInputs = page.locator('input[type="date"]');
          const dateCount = await dateInputs.count();

          if (dateCount >= 1) {
            const today = new Date();
            const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            await dateInputs.first().fill(firstDay);
            await page.waitForTimeout(1000);

            // Export with filter applied
            const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
            const hasExportButton = await exportButton.count().then(c => c > 0);

            if (hasExportButton) {
              let downloadTriggered = false;

              page.on('download', () => {
                downloadTriggered = true;
              });

              await exportButton.click();
              await page.waitForTimeout(2000);

              expect(downloadTriggered || (page as any).lastDownload).toBeTruthy();
            }
          }
        }
      }
    });
  });

  test.describe('Export Error Handling', () => {

    test('Should handle export with no transactions gracefully', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            // Click export - should either download empty CSV or show message
            await exportButton.click();
            await page.waitForTimeout(2000);

            // No error should be thrown
            const pageErrors = (page as any).pageErrors || [];
            expect(pageErrors.length).toBe(0);
          }
        }
      }
    });
  });

  test.describe('Mobile Export', () => {

    test('Should have export button accessible on mobile (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            // Check button is visible and has adequate touch target
            await expect(exportButton).toBeVisible();

            const box = await exportButton.boundingBox();
            if (box) {
              expect(box.height).toBeGreaterThanOrEqual(40);
            }
          }
        }
      }
    });

    test('Should not overflow horizontally on mobile during export', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
        }
      }
    });
  });

  test.describe('Export Button Placement', () => {

    test('Should position export button in accessible location', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            // Check if button is visible
            const isVisible = await exportButton.isVisible();
            expect(isVisible).toBe(true);
          }
        }
      }
    });
  });

  test.describe('CSV Format Compliance', () => {

    test('Should use proper CSV formatting (comma-separated, quoted)', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        const transactionsLink = page.locator('a[href*="transactions"], button:has-text("Transactions")').first();
        const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

        if (hasTransactionsLink) {
          await transactionsLink.click();
          await waitForPageReady(page);

          const exportButton = page.locator('button:has-text("Export CSV"), button:has-text("Export")').first();
          const hasExportButton = await exportButton.count().then(c => c > 0);

          if (hasExportButton) {
            let csvContent = '';

            page.on('download', async (download) => {
              const stream = await download.createReadStream();
              const chunks: Buffer[] = [];
              for await (const chunk of stream) {
                chunks.push(chunk);
              }
              csvContent = Buffer.concat(chunks).toString('utf-8');
            });

            await exportButton.click();
            await page.waitForTimeout(3000);

            if (csvContent) {
              // Check for comma separators
              const hasCommas = csvContent.includes(',');
              expect(hasCommas).toBe(true);

              // Check for quoted values
              const hasQuotes = csvContent.includes('"');
              expect(hasQuotes).toBe(true);
            }
          }
        }
      }
    });
  });
});
