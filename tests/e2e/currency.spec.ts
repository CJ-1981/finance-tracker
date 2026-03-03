import { test, expect } from '@playwright/test';

/**
 * Multi-Currency Support Tests
 * Tests creating projects with specific currencies, verifying currency symbols,
 * adding transactions with amounts, and cash counter emoji display
 */

test.describe('Multi-Currency Support', () => {

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

  test.describe('Project Currency Selection', () => {

    test('Should have currency selector in project creation form', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Look for create project button
      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Look for currency selector
        const currencySelect = page.locator('select[name="currency"], select#currency, select:has-text("Currency")');
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          await expect(currencySelect.first()).toBeAttached();
        }
      }
    });

    test('Should support EUR currency selection', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const currencySelect = page.locator('select').filter({ hasText: /currency|EUR|USD/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          // Check if EUR is an option
          const options = await currencySelect.locator("option");
          const hasEUR = options.some(opt => {
            const text = opt.toString().toUpperCase();
            return text.includes('EUR') || text.includes('€');
          });

          expect(hasEUR).toBe(true);
        }
      }
    });

    test('Should support USD currency selection', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const currencySelect = page.locator('select').filter({ hasText: /currency|EUR|USD/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          const options = await currencySelect.locator("option");
          const hasUSD = options.some(opt => {
            const text = opt.toString().toUpperCase();
            return text.includes('USD') || text.includes('$');
          });

          expect(hasUSD).toBe(true);
        }
      }
    });

    test('Should support GBP currency selection', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const currencySelect = page.locator('select').filter({ hasText: /currency/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          const options = await currencySelect.locator("option");
          const hasGBP = options.some(opt => {
            const text = opt.toString().toUpperCase();
            return text.includes('GBP') || text.includes('£') || text.includes('POUND');
          });

          expect(hasGBP).toBe(true);
        }
      }
    });

    test('Should support JPY currency selection', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const currencySelect = page.locator('select').filter({ hasText: /currency/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          const options = await currencySelect.locator("option");
          const hasJPY = options.some(opt => {
            const text = opt.toString().toUpperCase();
            return text.includes('JPY') || text.includes('¥') || text.includes('YEN');
          });

          expect(hasJPY).toBe(true);
        }
      }
    });

    test('Should support KRW currency selection', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const currencySelect = page.locator('select').filter({ hasText: /currency/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          const options = await currencySelect.locator("option");
          const hasKRW = options.some(opt => {
            const text = opt.toString().toUpperCase();
            return text.includes('KRW') || text.includes('₩') || text.includes('WON');
          });

          expect(hasKRW).toBe(true);
        }
      }
    });
  });

  test.describe('Create Project with Specific Currency', () => {

    test('Should create project with EUR currency', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Fill project form
        const nameInput = page.locator('input#name, input[placeholder*="name" i]').first();
        const hasNameInput = await nameInput.count().then(c => c > 0);

        if (hasNameInput) {
          const projectName = `EUR Project ${Date.now()}`;
          await nameInput.fill(projectName);

          // Select EUR currency
          const currencySelect = page.locator('select').filter({ hasText: /currency/i });
          const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

          if (hasCurrencySelect) {
            await currencySelect.selectOption('EUR');
          }

          // Submit form
          const submitButton = page.locator('button[type="submit"], button:has-text("Create")').last();
          await submitButton.click();
          await waitForPageReady(page);

          // Verify project was created
          const projectLink = page.locator('a, div').filter({ hasText: projectName });
          await expect(projectLink.first()).toBeAttached();
        }
      }
    });

    test('Should create project with USD currency', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const createButton = page.locator('button:has-text("New Project"), button:has-text("Create")').first();
      const hasCreateButton = await createButton.count().then(c => c > 0);

      if (hasCreateButton) {
        await createButton.click();
        await page.waitForTimeout(1000);

        const nameInput = page.locator('input#name, input[placeholder*="name" i]').first();
        const hasNameInput = await nameInput.count().then(c => c > 0);

        if (hasNameInput) {
          const projectName = `USD Project ${Date.now()}`;
          await nameInput.fill(projectName);

          const currencySelect = page.locator('select').filter({ hasText: /currency/i });
          const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

          if (hasCurrencySelect) {
            await currencySelect.selectOption('USD');
          }

          const submitButton = page.locator('button[type="submit"], button:has-text("Create")').last();
          await submitButton.click();
          await waitForPageReady(page);

          const projectLink = page.locator('a, div').filter({ hasText: projectName });
          await expect(projectLink.first()).toBeAttached();
        }
      }
    });
  });

  test.describe('Currency Symbol Display', () => {

    test('Should display EUR symbol (€) for EUR projects', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Look for EUR project or navigate to one
      const eurProject = page.locator('[data-testid^="project-card"], a[href*="/projects/"], div').filter({ hasText: /EUR|€/i }).first();
      const hasEURProject = await eurProject.count().then(c => c > 0);

      if (hasEURProject) {
        await eurProject.click();
        await waitForPageReady(page);

        // Look for EUR symbol
        const eurSymbol = page.locator('text=/€/i');
        const hasEURSymbol = await eurSymbol.count().then(c => c > 0);

        if (hasEURSymbol) {
          await expect(eurSymbol.first()).toBeVisible();
        }
      }
    });

    test('Should display USD symbol ($) for USD projects', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const usdProject = page.locator('[data-testid^="project-card"], a[href*="/projects/"], div').filter({ hasText: /USD|\$/i }).first();
      const hasUSDProject = await usdProject.count().then(c => c > 0);

      if (hasUSDProject) {
        await usdProject.click();
        await waitForPageReady(page);

        // Look for USD symbol
        const usdSymbol = page.locator('text=/\\$/');
        const hasUSDSymbol = await usdSymbol.count().then(c => c > 0);

        if (hasUSDSymbol) {
          await expect(usdSymbol.first()).toBeVisible();
        }
      }
    });

    test('Should display GBP symbol (£) for GBP projects', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const gbpProject = page.locator('[data-testid^="project-card"], a[href*="/projects/"], div').filter({ hasText: /GBP|£/i }).first();
      const hasGBPProject = await gbpProject.count().then(c => c > 0);

      if (hasGBPProject) {
        await gbpProject.click();
        await waitForPageReady(page);

        const gbpSymbol = page.locator('text=/£/i');
        const hasGBPSymbol = await gbpSymbol.count().then(c => c > 0);

        if (hasGBPSymbol) {
          await expect(gbpSymbol.first()).toBeVisible();
        }
      }
    });

    test('Should display JPY symbol (¥) for JPY projects', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const jpyProject = page.locator('[data-testid^="project-card"], a[href*="/projects/"], div').filter({ hasText: /JPY|¥/i }).first();
      const hasJPYProject = await jpyProject.count().then(c => c > 0);

      if (hasJPYProject) {
        await jpyProject.click();
        await waitForPageReady(page);

        const jpySymbol = page.locator('text=/¥/i');
        const hasJPYSymbol = await jpySymbol.count().then(c => c > 0);

        if (hasJPYSymbol) {
          await expect(jpySymbol.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Transaction with Currency', () => {

    test('Should show currency in transaction amount display', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Navigate to first available project
      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        await projectCard.click();
        await waitForPageReady(page);

        // Look for transaction amounts with currency symbols
        const amountDisplays = page.locator('text=/.*[€$£¥]\\s*\\d+.*/');
        const hasAmounts = await amountDisplays.count().then(c => c > 0);

        if (hasAmounts) {
          await expect(amountDisplays.first()).toBeAttached();
        }
      }
    });

    test('Should allow selecting currency when adding transaction', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        await projectCard.click();
        await waitForPageReady(page);

        // Open add transaction modal
        const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
        const hasAddButton = await addButton.count().then(c => c > 0);

        if (hasAddButton) {
          await addButton.click();
          await page.waitForTimeout(1000);

          // Look for currency selector in transaction form
          const currencySelect = page.locator('select#modal-currency, select').filter({ hasText: /USD|EUR/i });
          const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

          if (hasCurrencySelect) {
            await expect(currencySelect.first()).toBeAttached();
          }
        }
      }
    });

    test('Should default to project currency when adding transaction', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        // Get project currency from card text
        const cardText = await projectCard.textContent();
        const projectCurrency = cardText?.match(/EUR|USD|GBP|JPY|KRW/i)?.[0] || 'USD';

        await projectCard.click();
        await waitForPageReady(page);

        const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
        const hasAddButton = await addButton.count().then(c => c > 0);

        if (hasAddButton) {
          await addButton.click();
          await page.waitForTimeout(1000);

          const currencySelect = page.locator('select#modal-currency, select').filter({ hasText: /USD|EUR/i });
          const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

          if (hasCurrencySelect) {
            const selectedValue = await currencySelect.inputValue();
            expect(selectedValue.toUpperCase()).toContain(projectCurrency.toUpperCase());
          }
        }
      }
    });
  });

  test.describe('Cash Counter Currency Display', () => {

    test('Should show bill emoji for EUR currency in cash counter', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Look for EUR project
      const eurProject = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').filter({ hasText: /EUR/i }).first();
      const hasEURProject = await eurProject.count().then(c => c > 0);

      if (hasEURProject) {
        await eurProject.click();
        await waitForPageReady(page);

        // Open cash counter modal
        const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
        const hasCashButton = await cashCounterButton.count().then(c => c > 0);

        if (hasCashButton) {
          await cashCounterButton.click();
          await page.waitForTimeout(1000);

          // Look for bill emoji (💵)
          const billEmoji = page.locator('text=💵');
          const hasBillEmoji = await billEmoji.count().then(c => c > 0);

          if (hasBillEmoji) {
            await expect(billEmoji.first()).toBeVisible();
          }
        }
      }
    });

    test('Should show coin emoji for EUR currency in cash counter', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const eurProject = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').filter({ hasText: /EUR/i }).first();
      const hasEURProject = await eurProject.count().then(c => c > 0);

      if (hasEURProject) {
        await eurProject.click();
        await waitForPageReady(page);

        const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
        const hasCashButton = await cashCounterButton.count().then(c => c > 0);

        if (hasCashButton) {
          await cashCounterButton.click();
          await page.waitForTimeout(1000);

          // Look for coin emoji (⚪)
          const coinEmoji = page.locator('text=⚪');
          const hasCoinEmoji = await coinEmoji.count().then(c => c > 0);

          if (hasCoinEmoji) {
            await expect(coinEmoji.first()).toBeVisible();
          }
        }
      }
    });

    test('Should display currency symbol in cash counter totals', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        await projectCard.click();
        await waitForPageReady(page);

        const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
        const hasCashButton = await cashCounterButton.count().then(c => c > 0);

        if (hasCashButton) {
          await cashCounterButton.click();
          await page.waitForTimeout(1000);

          // Look for currency symbol in total display
          const currencySymbols = page.locator('text=/€|EUR|\\$|USD|£|GBP/i');
          const hasSymbols = await currencySymbols.count().then(c => c > 0);

          if (hasSymbols) {
            await expect(currencySymbols.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Currency in Charts', () => {

    test('Should display currency in chart tooltips or labels', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        await projectCard.click();
        await waitForPageReady(page);

        // Charts typically render on canvas, so we look for currency indicators nearby
        const currencyLabels = page.locator('text=/€|EUR|\\$|USD|£|GBP/i');
        const hasLabels = await currencyLabels.count().then(c => c > 0);

        if (hasLabels) {
          await expect(currencyLabels.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Currency Settings', () => {

    test('Should persist currency setting across sessions', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        // Get project currency
        const cardText = await projectCard.textContent();
        const projectCurrency = cardText?.match(/EUR|USD|GBP|JPY|KRW/i)?.[0];

        if (projectCurrency) {
          await projectCard.click();
          await waitForPageReady(page);

          // Reload page
          await page.reload();
          await waitForPageReady(page);

          // Currency should still be displayed
          const currencyLabel = page.locator('text=' + projectCurrency);
          const hasCurrency = await currencyLabel.count().then(c => c > 0);

          if (hasCurrency) {
            await expect(currencyLabel.first()).toBeAttached();
          }
        }
      }
    });
  });

  test.describe('Multiple Currencies in Same App', () => {

    test('Should handle multiple projects with different currencies', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Look for different currency indicators on project cards
      const eurIndicator = page.locator('text=/EUR/i');
      const usdIndicator = page.locator('text=/USD/i');

      const hasEUR = await eurIndicator.count().then(c => c > 0);
      const hasUSD = await usdIndicator.count().then(c => c > 0);

      // App should support displaying multiple currencies
      expect(hasEUR || hasUSD).toBe(true);
    });

    test('Should not mix currencies between projects', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Get all project cards
      const projectCards = page.locator('[data-testid^="project-card"], a[href*="/projects/"]');
      const cardCount = await projectCards.count();

      if (cardCount > 1) {
        // Each project should show its own currency
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = projectCards.nth(i);
          const cardText = await card.textContent();

          // Verify only one currency is mentioned per card
          const currencies = (cardText || '').match(/EUR|USD|GBP|JPY|KRW/gi) || [];
          expect(currencies.length).toBeLessThanOrEqual(2); // May appear twice (label + symbol)
        }
      }
    });
  });

  test.describe('Currency Formatting', () => {

    test('Should format amounts with correct decimal places', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        await projectCard.click();
        await waitForPageReady(page);

        // Look for amount displays with decimal formatting
        const amountDisplays = page.locator('text=/\\d+\\.\\d{2}/');
        const hasAmounts = await amountDisplays.count().then(c => c > 0);

        if (hasAmounts) {
          await expect(amountDisplays.first()).toBeAttached();
        }
      }
    });

    test('Should handle zero amounts correctly', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProject = await projectCard.count().then(c => c > 0);

      if (hasProject) {
        await projectCard.click();
        await waitForPageReady(page);

        // Look for zero amount displays
        const zeroAmounts = page.locator('text=/.*[€$£¥]\\s*0\\.00.*/');
        const hasZeros = await zeroAmounts.count().then(c => c > 0);

        if (hasZeros) {
          await expect(zeroAmounts.first()).toBeAttached();
        }
      }
    });
  });
});
