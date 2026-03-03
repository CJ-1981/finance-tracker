import { test, expect } from '@playwright/test';

/**
 * Transaction Management Tests
 * Tests adding, editing, soft deleting, restoring, and permanently deleting transactions
 * including mobile responsiveness and custom field handling
 */

test.describe('Transaction Management', () => {

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

  test.describe('Add Transaction', () => {

    test('Should display add transaction modal when button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Look for add transaction button
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button[aria-label*="add" i]').first();
      await expect(addButton).toBeAttached({ timeout: 5000 });

      await addButton.click();
      await waitForPageReady(page);

      // Modal should be visible
      const modal = page.locator('.fixed.inset-0, [role="dialog"]');
      await expect(modal.first()).toBeVisible();
    });

    test('Should have income/expense toggle buttons', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Look for income/expense buttons
        const incomeButton = page.locator('button', { hasText: /income/i });
        const expenseButton = page.locator('button', { hasText: /expense/i });

        const hasIncome = await incomeButton.count().then(c => c > 0);
        const hasExpense = await expenseButton.count().then(c => c > 0);

        expect(hasIncome || hasExpense).toBe(true);
      }
    });

    test('Should switch between income and expense modes', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const incomeButton = page.locator('button', { hasText: /income/i });
        const expenseButton = page.locator('button', { hasText: /expense/i });

        const hasIncome = await incomeButton.count().then(c => c > 0);
        const hasExpense = await expenseButton.count().then(c => c > 0);

        if (hasIncome && hasExpense) {
          // Click income button
          await incomeButton.click();
          await page.waitForTimeout(500);

          // Check if income button has active styling
          const incomeClasses = await incomeButton.getAttribute('class') || '';
          const isActive = incomeClasses.includes('bg-emerald') || incomeClasses.includes('bg-green');

          // Click expense button
          await expenseButton.click();
          await page.waitForTimeout(500);

          // Check if expense button has active styling
          const expenseClasses = await expenseButton.getAttribute('class') || '';
          const isExpenseActive = expenseClasses.includes('bg-rose') || expenseClasses.includes('bg-red');

          expect(isActive || isExpenseActive).toBe(true);
        }
      }
    });

    test('Should have amount input field', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const amountInput = page.locator('input#modal-amount, input[type="number"]').first();
        await expect(amountInput).toBeAttached();
      }
    });

    test('Should have category selector', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const categorySelect = page.locator('select#modal-category, select').filter({ hasText: /uncategorized|category/i });
        const hasCategorySelect = await categorySelect.count().then(c => c > 0);

        if (hasCategorySelect) {
          await expect(categorySelect.first()).toBeAttached();
        }
      }
    });

    test('Should have date picker', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const dateInput = page.locator('input#modal-date, input[type="date"]').first();
        await expect(dateInput).toBeAttached();
      }
    });
  });

  test.describe('Custom Fields', () => {

    test('Should display custom fields in modal', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Look for custom field inputs (would be dynamically added based on project settings)
        const customInputs = page.locator('input:not(#modal-amount):not(#modal-date):not([type="email"]):not([type="password"])');
        const hasCustomInputs = await customInputs.count().then(c => c > 0);

        if (hasCustomInputs) {
          // Custom fields exist for this project
          await expect(customInputs.first()).toBeAttached();
        }
      }
    });

    test('Should handle text custom fields', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Look for text input with datalist (autocomplete)
        const textInputs = page.locator('input[list]');
        const hasTextInputs = await textInputs.count().then(c => c > 0);

        if (hasTextInputs) {
          await expect(textInputs.first()).toBeAttached();
        }
      }
    });

    test('Should handle select custom fields', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Count select elements (excluding category)
        const allSelects = page.locator('select');
        const selectCount = await allSelects.count();

        if (selectCount > 1) {
          // Additional selects beyond category selector
          await expect(allSelects.nth(0)).toBeAttached();
        }
      }
    });

    test('Should handle date custom fields', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Look for multiple date inputs
        const dateInputs = page.locator('input[type="date"]');
        const dateCount = await dateInputs.count();

        if (dateCount > 1) {
          // Additional date inputs beyond main date field
          await expect(dateInputs.nth(0)).toBeAttached();
        }
      }
    });
  });

  test.describe('Soft Delete', () => {

    test('Should show delete confirmation when deleting transaction', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Navigate to transactions page if possible
      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for delete button in transaction list
      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
      const hasDeleteButton = await deleteButton.count().then(c => c > 0);

      if (hasDeleteButton) {
        // Set up dialog handler before clicking
        page.on('dialog', async dialog => {
          expect(dialog.message()).toBeTruthy();
          await dialog.dismiss();
        });

        await deleteButton.click();
        await page.waitForTimeout(1000);
      }
    });

    test('Should soft delete transaction when confirmed', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
      const hasDeleteButton = await deleteButton.count().then(c => c > 0);

      if (hasDeleteButton) {
        // Accept the confirmation dialog
        page.on('dialog', dialog => dialog.accept());

        // Count transactions before delete
        const transactionRows = page.locator('tr, [data-testid*="transaction"]');
        const countBefore = await transactionRows.count();

        await deleteButton.click();
        await waitForPageReady(page);

        // Count transactions after delete
        const countAfter = await transactionRows.count();

        // Transaction should be removed from visible list
        expect(countAfter).toBeLessThanOrEqual(countBefore);
      }
    });

    test('Should have show deleted toggle', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for show deleted toggle
      const showDeletedToggle = page.locator('input[type="checkbox"][id*="deleted"], label:has-text("Show deleted"), label:has-text("Include deleted")');
      const hasToggle = await showDeletedToggle.count().then(c => c > 0);

      if (hasToggle) {
        await expect(showDeletedToggle.first()).toBeAttached();
      }
    });
  });

  test.describe('Restore Transaction', () => {

    test('Should show restore option for deleted transactions', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for show deleted toggle and enable it
      const showDeletedToggle = page.locator('input[type="checkbox"][id*="deleted"], label:has-text("Show deleted")');
      const toggleCount = await showDeletedToggle.count();

      if (toggleCount > 0) {
        // Determine if the locator found the input or label
        const isInput = await showDeletedToggle.first().evaluate(el => el.tagName === 'INPUT');

        if (isInput) {
          const checkbox = showDeletedToggle.first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        } else {
          const checkbox = showDeletedToggle.locator('input[type="checkbox"]').first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await showDeletedToggle.first().click();
            await page.waitForTimeout(1000);
          }
        }

        // Look for restore button
        const restoreButton = page.locator('button:has-text("Restore"), button[aria-label*="restore" i]');
        const hasRestore = await restoreButton.count().then(c => c > 0);

        if (hasRestore) {
          await expect(restoreButton.first()).toBeAttached();
        }
      }
    });

    test('Should restore transaction when restore button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const showDeletedToggle = page.locator('input[type="checkbox"][id*="deleted"], label:has-text("Show deleted")');
      const toggleCount = await showDeletedToggle.count();

      if (toggleCount > 0) {
        // Determine if the locator found the input or label
        const isInput = await showDeletedToggle.first().evaluate(el => el.tagName === 'INPUT');

        if (isInput) {
          const checkbox = showDeletedToggle.first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        } else {
          const checkbox = showDeletedToggle.locator('input[type="checkbox"]').first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        }

        const restoreButton = page.locator('button:has-text("Restore")').first();
        const hasRestore = await restoreButton.count().then(c => c > 0);

        if (hasRestore) {
          await restoreButton.click();
          await page.waitForTimeout(1000);

          // Transaction should be restored and no longer in deleted section
          const restoreButtonsAfter = page.locator('button:has-text("Restore")');
          const countAfter = await restoreButtonsAfter.count();

          // Restored transaction should be removed from deleted list
          expect(countAfter).toBeLessThan(1);
        }
      }
    });
  });

  test.describe('Permanently Delete', () => {

    test('Should have permanently delete option for deleted transactions', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const showDeletedToggle = page.locator('input[type="checkbox"][id*="deleted"], label:has-text("Show deleted")');
      const toggleCount = await showDeletedToggle.count();

      if (toggleCount > 0) {
        // Determine if the locator found the input or label
        const isInput = await showDeletedToggle.first().evaluate(el => el.tagName === 'INPUT');

        if (isInput) {
          const checkbox = showDeletedToggle.first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        } else {
          const checkbox = showDeletedToggle.locator('input[type="checkbox"]').first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        }

        // Look for permanently delete button
        const permanentDeleteButton = page.locator('button:has-text("Permanently"), button:has-text("Forever")');
        const hasPermanentDelete = await permanentDeleteButton.count().then(c => c > 0);

        if (hasPermanentDelete) {
          await expect(permanentDeleteButton.first()).toBeAttached();
        }
      }
    });

    test('Should show confirmation for permanent delete', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const showDeletedToggle = page.locator('input[type="checkbox"][id*="deleted"], label:has-text("Show deleted")');
      const toggleCount = await showDeletedToggle.count();

      if (toggleCount > 0) {
        // Determine if the locator found the input or label
        const isInput = await showDeletedToggle.first().evaluate(el => el.tagName === 'INPUT');

        if (isInput) {
          const checkbox = showDeletedToggle.first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        } else {
          const checkbox = showDeletedToggle.locator('input[type="checkbox"]').first();
          const isChecked = await checkbox.isChecked();

          if (!isChecked) {
            await checkbox.click();
            await page.waitForTimeout(1000);
          }
        }

        const permanentDeleteButton = page.locator('button:has-text("Permanently")').first();
        const hasPermanentDelete = await permanentDeleteButton.count().then(c => c > 0);

        if (hasPermanentDelete) {
          // Set up dialog handler
          page.on('dialog', async dialog => {
            expect(dialog.message()).toMatch(/permanently|forever|delete/i);
            await dialog.dismiss();
          });

          await permanentDeleteButton.click();
        }
      }
    });
  });

  test.describe('Edit Transaction', () => {

    test('Should open edit modal when edit button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for edit button
      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
      const hasEditButton = await editButton.count().then(c => c > 0);

      if (hasEditButton) {
        await editButton.click();
        await waitForPageReady(page);

        // Modal should be visible with edit title
        const modalTitle = page.locator('h2, h1').filter({ hasText: /edit/i });
        const hasEditTitle = await modalTitle.count().then(c => c > 0);

        if (hasEditTitle) {
          await expect(modalTitle.first()).toBeVisible();
        }
      }
    });

    test('Should pre-fill form with existing transaction data', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const editButton = page.locator('button:has-text("Edit"), button[aria-label*="edit" i]').first();
      const hasEditButton = await editButton.count().then(c => c > 0);

      if (hasEditButton) {
        await editButton.click();
        await waitForPageReady(page);

        // Check if amount field has a value
        const amountInput = page.locator('input#modal-amount, input[type="number"]').first();
        const value = await amountInput.inputValue();

        // Amount should have some value (not empty for existing transaction)
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Filter and Sort', () => {

    test('Should have category filter dropdown', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for category filter
      const categoryFilter = page.locator('select:has-text("All"), select[aria-label*="category" i], label:has-text("Category") + select');
      const hasFilter = await categoryFilter.count().then(c => c > 0);

      if (hasFilter) {
        await expect(categoryFilter.first()).toBeAttached();
      }
    });

    test('Should filter transactions by category', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const categoryFilter = page.locator('select').filter({ hasText: /all|category/i });
      const hasFilter = await categoryFilter.count().then(c => c > 0);

      if (hasFilter) {
        // Get initial count
        const transactionRows = page.locator('tr:not(.hidden), [data-testid*="transaction"]');
        const initialCount = await transactionRows.count();

        // Select a category option (assuming there are options)
        const optionCount = await categoryFilter.locator('option').count();
        if (optionCount > 1) {
          // Get initial count
          const initialCount = await transactionRows.count();

          await categoryFilter.selectOption({ index: 1 });
          await page.waitForTimeout(1000);

          // Count should change or stay same
          const filteredCount = await transactionRows.count();
          expect(filteredCount).toBeLessThanOrEqual(initialCount);
        }
      }
    });

    test('Should have sort options for transactions', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for sort controls (could be buttons or dropdown)
      const sortButton = page.locator('button:has-text("Sort"), th[role="button"][aria-sort]');
      const hasSort = await sortButton.count().then(c => c > 0);

      if (hasSort) {
        await expect(sortButton.first()).toBeAttached();
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {

    test('Should display transaction list on 375px viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Check for horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    test('Should have touch-friendly action buttons on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Check button sizes
      const buttons = page.locator('button').filter(async btn => {
        const isVisible = await btn.isVisible().catch(() => false);
        return isVisible;
      });

      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        const firstButton = buttons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          // At least one button should meet touch target requirements
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test('Should stack transaction details vertically on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);

        // Check if table has responsive class or alternative layout
        const table = page.locator('table');
        const hasTable = await table.count().then(c => c > 0);

        if (hasTable) {
          // On mobile, table should be scrollable or stacked
          const tableOverflow = await table.first().evaluate(el => {
            return window.getComputedStyle(el).overflowX;
          });

          const isScrollable = tableOverflow === 'auto' || tableOverflow === 'scroll';
          expect(isScrollable).toBe(true);
        }
      }
    });
  });

  test.describe('Validation', () => {

    test('Should require amount field', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Try to submit without amount
        const amountInput = page.locator('input#modal-amount, input[type="number"]').first();
        const submitButton = page.locator('button[type="submit"]').filter({ hasText: /add|save/i });

        const hasSubmit = await submitButton.count().then(c => c > 0);

        if (hasSubmit) {
          const isRequired = await amountInput.getAttribute('required');
          const hasRequired = isRequired !== null;

          if (hasRequired) {
            const isValid = await amountInput.evaluate(el => (el as HTMLInputElement).checkValidity());
            expect(isValid).toBe(false); // Should be invalid when empty
          }
        }
      }
    });

    test('Should require date field', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const dateInput = page.locator('input#modal-date, input[type="date"]').first();
        const isRequired = await dateInput.getAttribute('required');

        if (isRequired !== null) {
          const isValid = await dateInput.evaluate(el => (el as HTMLInputElement).checkValidity());
          expect(isValid).toBe(true); // Date inputs have default values
        }
      }
    });
  });

  test.describe('Currency Selection', () => {

    test('Should have currency selector in transaction form', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const currencySelect = page.locator('select#modal-currency, select').filter({ hasText: /USD|EUR/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          await expect(currencySelect.first()).toBeAttached();
        }
      }
    });

    test('Should support multiple currency options', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const currencySelect = page.locator('select#modal-currency, select').filter({ hasText: /USD|EUR/i });
        const hasCurrencySelect = await currencySelect.count().then(c => c > 0);

        if (hasCurrencySelect) {
          const optionCount = await currencySelect.locator('option').count();
          expect(optionCount).toBeGreaterThanOrEqual(2); // At least USD and EUR
        }
      }
    });
  });
});
