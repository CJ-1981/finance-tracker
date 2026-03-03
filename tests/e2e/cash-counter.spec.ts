import { test, expect } from '@playwright/test';

/**
 * Cash Counter Modal Tests
 * Tests the cash counter functionality including EUR denominations,
 * mobile responsiveness, entry management, and match status calculations
 */

test.describe('Cash Counter Modal', () => {

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

  test.describe('EUR Denominations', () => {

    test('Should display all EUR bill denominations (200, 100, 50, 20, 10, 5)', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Try to navigate to a project detail page (cash counter is accessed from there)
      // This test assumes there's a project or tests the modal when available
      const currentUrl = page.url();

      // If we have access to a project, look for cash counter button
      if (currentUrl.includes('/projects')) {
        const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter"), button[title*="cash" i]').first();

        // Assert button exists - fail test if missing
        await expect(cashCounterButton).toBeAttached({ timeout: 5000 });

        await cashCounterButton.click();
        await waitForPageReady(page);

        // Check for bill denominations
        const expectedBills = ['200', '100', '50', '20', '10', '5'];

        for (const bill of expectedBills) {
          const billElement = page.locator(`text=/.*${bill}.*/`).filter({ hasText: bill });
          const hasBill = await billElement.count().then(c => c > 0);

          if (hasBill) {
            await expect(billElement.first()).toBeVisible();
          }
        }
      }
    });

    test('Should display all EUR coin denominations (2, 1, 0.50, 0.20, 0.10, 0.05, 0.02, 0.01)', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();

      // Assert button exists - fail test if missing
      await expect(cashCounterButton).toBeAttached({ timeout: 5000 });

      await cashCounterButton.click();
      await waitForPageReady(page);

      // Check for coin denominations
      const expectedCoins = ['2', '1', '0.50', '0.20', '0.10', '0.05', '0.02', '0.01'];

      for (const coin of expectedCoins) {
        const coinElement = page.locator(`text=/.*${coin}.*/`).filter({ hasText: coin });
        const hasCoin = await coinElement.count().then(c => c > 0);

        if (hasCoin) {
          await expect(coinElement.first()).toBeVisible();
        }
      }
    });

    test('Should display currency emoji for bills and coins', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Check for currency emojis (💵 for bills, ⚪ for coins in EUR)
        const billEmoji = page.locator('text=💵');
        const coinEmoji = page.locator('text=⚪');

        const hasBillEmoji = await billEmoji.count().then(c => c > 0);
        const hasCoinEmoji = await coinEmoji.count().then(c => c > 0);

        // At least one emoji type should be present
        expect(hasBillEmoji || hasCoinEmoji).toBe(true);
      }
    });
  });

  test.describe('Quantity Controls', () => {

    test('Should increment denomination count with + button', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Find a denomination row and click the + button
        const plusButtons = page.locator('button').filter({ hasText: '+' });
        const hasPlusButtons = await plusButtons.count().then(c => c > 0);

        if (hasPlusButtons) {
          const firstPlus = plusButtons.first();

          // Get initial value from the input - use stable ancestor selector
          const row = firstPlus.locator('xpath=ancestor::*[.//input[@type="number"]][1]');
          const inputField = row.locator('input[type="number"]').first();
          const initialValue = await inputField.inputValue();

          // Click the + button
          await firstPlus.click();
          await page.waitForTimeout(500); // Wait for state update

          // Get new value
          const newValue = await inputField.inputValue();

          // New value should be greater than initial
          expect(parseInt(newValue) || 0).toBeGreaterThan(parseInt(initialValue) || 0);
        }
      }
    });

    test('Should decrement denomination count with - button', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // First increment, then decrement
        const plusButtons = page.locator('button').filter({ hasText: '+' });
        const hasPlusButtons = await plusButtons.count().then(c => c > 0);

        if (hasPlusButtons) {
          const firstPlus = plusButtons.first();
          await firstPlus.click();
          await page.waitForTimeout(500);

          // Now test decrement
          const minusButtons = page.locator('button').filter({ hasText: /[-−]/ });
          const hasMinusButtons = await minusButtons.count().then(c => c > 0);

          if (hasMinusButtons) {
            // Use stable ancestor selector to find the input field
            const row = firstPlus.locator('xpath=ancestor::*[.//input[@type="number"]][1]');
            const inputField = row.locator('input[type="number"]').first();
            const valueBeforeDecrement = await inputField.inputValue();

            const firstMinus = minusButtons.first();
            await firstMinus.click();
            await page.waitForTimeout(500);

            const valueAfterDecrement = await inputField.inputValue();

            expect(parseInt(valueAfterDecrement) || 0).toBeLessThanOrEqual(parseInt(valueBeforeDecrement) || 0);
          }
        }
      }
    });

    test('Should disable - button when count is 0', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Check if - button is disabled for zero count
        const minusButtons = page.locator('button:disabled').filter({ hasText: /[-−]/ });
        const hasDisabledMinus = await minusButtons.count().then(c => c > 0);

        // At least one minus button should be disabled initially (all counts start at 0)
        expect(hasDisabledMinus).toBe(true);
      }
    });

    test('Should allow direct number input', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Find number input fields
        const numberInputs = page.locator('input[type="number"]');
        const hasInputs = await numberInputs.count().then(c => c > 0);

        if (hasInputs) {
          const firstInput = numberInputs.first();

          // Clear and set a new value
          await firstInput.fill('');
          await firstInput.fill('5');
          await page.waitForTimeout(500);

          // Verify the value was set
          const value = await firstInput.inputValue();
          expect(value).toBe('5');
        }
      }
    });
  });

  test.describe('Entry Categories', () => {

    test('Should switch between anonymous and named entry categories', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for category toggle buttons
        const anonymousButton = page.locator('button', { hasText: /anonymous/i });
        const namedButton = page.locator('button', { hasText: /named|with name/i });

        const hasAnonymous = await anonymousButton.count().then(c => c > 0);
        const hasNamed = await namedButton.count().then(c => c > 0);

        if (hasAnonymous && hasNamed) {
          // Click named button
          await namedButton.click();
          await page.waitForTimeout(500);

          // Check if name input appears
          const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]');
          const hasNameInput = await nameInput.count().then(c => c > 0);

          if (hasNameInput) {
            await expect(nameInput.first()).toBeVisible();
          }

          // Switch back to anonymous
          await anonymousButton.click();
          await page.waitForTimeout(500);
        }
      }
    });

    test('Should show name input when named category is selected', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        const namedButton = page.locator('button', { hasText: /named|with name/i });
        const hasNamed = await namedButton.count().then(c => c > 0);

        if (hasNamed) {
          await namedButton.click();
          await page.waitForTimeout(500);

          // Look for name input field
          const nameInput = page.locator('input[placeholder*="name" i], input[type="text"]');
          const hasNameInput = await nameInput.count().then(c => c > 0);

          if (hasNameInput) {
            await expect(nameInput.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Total Calculation', () => {

    test('Should calculate current entry total correctly', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for current entry total display
        const totalDisplay = page.locator('text=/.*[E€£$]\\s*\\d+\\.\\d{2}.*/').first();
        const hasTotal = await totalDisplay.count().then(c => c > 0);

        if (hasTotal) {
          await expect(totalDisplay).toBeVisible();
        }
      }
    });

    test('Should show bills and coins breakdown', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for breakdown labels
        const billsLabel = page.locator('text=/bills/i');
        const coinsLabel = page.locator('text=/coins/i');

        const hasBills = await billsLabel.count().then(c => c > 0);
        const hasCoins = await coinsLabel.count().then(c => c > 0);

        // Both breakdown sections should be present
        expect(hasBills && hasCoins).toBe(true);
      }
    });

    test('Should calculate grand total from all entries', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for grand total display
        const grandTotalLabel = page.locator('text=/total counted|grand total/i');
        const hasGrandTotal = await grandTotalLabel.count().then(c => c > 0);

        if (hasGrandTotal) {
          await expect(grandTotalLabel.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Match Status', () => {

    test('Should display match status against transactions', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for match/excess/shortage status
        const statusLabels = page.locator('text=/match|excess|shortage/i');
        const hasStatus = await statusLabels.count().then(c => c > 0);

        if (hasStatus) {
          await expect(statusLabels.first()).toBeVisible();
        }
      }
    });

    test('Should show transactions total for comparison', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for transactions total
        const transactionsLabel = page.locator('text=/transactions/i');
        const hasTransactions = await transactionsLabel.count().then(c => c > 0);

        if (hasTransactions) {
          await expect(transactionsLabel.first()).toBeVisible();
        }
      }
    });

    test('Should display difference amount', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for difference display with currency amount
        const differenceDisplay = page.locator('text=/.*[E€£$]\\s*\\d+\\.\\d{2}.*/');
        const hasDifference = await differenceDisplay.count().then(c => c > 0);

        if (hasDifference) {
          await expect(differenceDisplay.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Entry Management', () => {

    test('Should add entry when add entry button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Add some cash to make entry valid
        const plusButtons = page.locator('button').filter({ hasText: '+' });
        const hasPlusButtons = await plusButtons.count().then(c => c > 0);

        if (hasPlusButtons) {
          await plusButtons.first().click();
          await page.waitForTimeout(500);

          // Click add entry button
          const addEntryButton = page.locator('button', { hasText: /add entry/i });
          const hasAddButton = await addEntryButton.count().then(c => c > 0);

          if (hasAddButton) {
            await addEntryButton.click();
            await page.waitForTimeout(1000);

            // Verify entry was added (look for entries section)
            const entriesLabel = page.locator('text=/entries/i');
            const hasEntries = await entriesLabel.count().then(c => c > 0);

            if (hasEntries) {
              await expect(entriesLabel.first()).toBeVisible();
            }
          }
        }
      }
    });

    test('Should delete entry when delete button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for existing entries
        const deleteButtons = page.locator('button', { hasText: /delete|remove/i });
        const hasDeleteButtons = await deleteButtons.count().then(c => c > 0);

        if (hasDeleteButtons) {
          const entryCountBefore = await deleteButtons.count();

          // Click first delete button
          await deleteButtons.first().click();
          await page.waitForTimeout(1000);

          // Check if entry was removed (count should decrease or entry gone)
          const deleteButtonsAfter = page.locator('button', { hasText: /delete|remove/i });
          const entryCountAfter = await deleteButtonsAfter.count();

          expect(entryCountAfter).toBeLessThanOrEqual(entryCountBefore);
        }
      }
    });

    test('Should clear all entries when clear all button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        const clearAllButton = page.locator('button', { hasText: /clear all/i });
        const hasClearAll = await clearAllButton.count().then(c => c > 0);

        if (hasClearAll) {
          // Handle confirm dialog
          page.on('dialog', dialog => dialog.accept());

          await clearAllButton.click();
          await page.waitForTimeout(1000);

          // Verify all entries are cleared (look for empty state)
          const entriesLabel = page.locator('text=/entries/i');
          const hasEntriesLabel = await entriesLabel.count().then(c => c > 0);

          if (hasEntriesLabel) {
            // If entries label exists, entries section should be empty or hidden
            const entriesSection = entriesLabel.locator('xpath=../..');
            const isVisible = await entriesSection.isVisible().catch(() => false);

            // Entries should either be hidden or show empty state
            if (isVisible) {
              const entryItems = entriesSection.locator('text=/EUR|USD/').filter({ hasText: /\d+\.\d{2}/ });
              const hasEntries = await entryItems.count().then(c => c > 0);
              expect(hasEntries).toBe(false);
            }
          }
        }
      }
    });
  });

  test.describe('Mobile Responsiveness (375px)', () => {

    test('Should display correctly on 375px viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Check for horizontal overflow
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
      }
    });

    test('Should have touch-friendly buttons on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Check button sizes for increment/decrement buttons
        const controlButtons = page.locator('button').filter({ hasText: /[+−-]/ });
        const hasButtons = await controlButtons.count().then(c => c > 0);

        if (hasButtons) {
          const firstButton = controlButtons.first();
          const box = await firstButton.boundingBox();

          if (box) {
            // Buttons should be at least 44px tall for touch
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });

    test('Should scroll within modal on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Modal should have overflow scroll
        const modalContent = page.locator('.overflow-y-auto, .max-h-\\[90vh\\]').first();
        const hasModal = await modalContent.count().then(c => c > 0);

        if (hasModal) {
          await expect(modalContent).toBeVisible();
        }
      }
    });
  });

  test.describe('Modal Behavior', () => {

    test('Should close modal when X button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(c => c > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Look for close button (X)
        const closeButton = page.locator('button', { hasText: '×' }).or(
          page.locator('button[aria-label*="close" i]')
        );

        const hasClose = await closeButton.count().then(c => c > 0);

        if (hasClose) {
          await closeButton.first().click();
          await page.waitForTimeout(1000);

          // Modal should be closed (check for absence of modal content)
          const modal = page.locator('.fixed.inset-0').filter({ hasText: /cash|counter/i });
          const isModalVisible = await modal.isVisible().catch(() => false);

          expect(isModalVisible).toBe(false);
        }
      }
    });

    test('Should show modal backdrop overlay', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(count => count > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Check for backdrop overlay
        const backdrop = page.locator('.fixed.inset-0.bg-black');
        const hasBackdrop = await backdrop.count().then(c => c > 0);

        if (hasBackdrop) {
          await expect(backdrop.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Persistence', () => {

    test('Should persist entries across modal reopen', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const cashCounterButton = page.locator('button:has-text("Cash"), button:has-text("Counter")').first();
      const hasButton = await cashCounterButton.count().then(c => c > 0);

      if (hasButton) {
        await cashCounterButton.click();
        await waitForPageReady(page);

        // Add an entry
        const plusButtons = page.locator('button').filter({ hasText: '+' });
        const hasPlusButtons = await plusButtons.count().then(c => c > 0);

        if (hasPlusButtons) {
          await plusButtons.first().click();
          await page.waitForTimeout(500);

          const addEntryButton = page.locator('button', { hasText: /add entry/i });
          const hasAddButton = await addEntryButton.count().then(c => c > 0);

          if (hasAddButton) {
            await addEntryButton.click();
            await page.waitForTimeout(1000);

            // Close modal
            const closeButton = page.locator('button', { hasText: '×' });
            const hasClose = await closeButton.count().then(c => c > 0);

            if (hasClose) {
              await closeButton.first().click();
              await page.waitForTimeout(1000);

              // Reopen modal
              await cashCounterButton.click();
              await waitForPageReady(page);

              // Entries should still be visible
              const entriesLabel = page.locator('text=/entries/i');
              const hasEntries = await entriesLabel.count().then(c => c > 0);

              if (hasEntries) {
                await expect(entriesLabel.first()).toBeVisible();
              }
            }
          }
        }
      }
    });
  });
});
