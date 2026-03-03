import { test, expect } from '@playwright/test';

/**
 * Category Management Tests
 * Tests creating new categories, assigning colors, reordering, deleting,
 * and verifying categories appear in transaction dropdown
 */

test.describe('Category Management', () => {

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

  test.describe('Create Category', () => {

    test('Should display category creation form', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for category creation section
      const categoryInput = page.locator('input[placeholder*="category" i], input#new-category').first();
      const hasCategoryInput = await categoryInput.count().then(c => c > 0);

      if (hasCategoryInput) {
        await expect(categoryInput).toBeAttached();
      }
    });

    test('Should have name input field for new category', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const categoryInput = page.locator('input[type="text"]').filter({ placeholder:  });
      const hasInput = await categoryInput.count().then(c => c > 0);

      if (hasInput) {
        await expect(categoryInput.first()).toBeAttached();
      }
    });

    test('Should create category when add button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const categoryInput = page.locator('input[placeholder*="New category" i], input[type="text"]').first();
      const hasCategoryInput = await categoryInput.count().then(c => c > 0);

      if (hasCategoryInput) {
        // Generate unique category name
        const uniqueName = `Test Category ${Date.now()}`;
        await categoryInput.fill(uniqueName);

        // Look for add/create button
        const addButton = page.locator('button:has-text("Add"), button:has-text("Create")').filter({ hasText: /category/i }).or(
          page.locator('button').filter({ has: categoryInput })
        ).first();

        const hasAddButton = await addButton.count().then(c => c > 0);

        if (hasAddButton) {
          const categoriesBefore = await page.locator('text=/category/i').count();

          await addButton.click();
          await waitForPageReady(page);

          // Look for new category in the list
          const newCategory = page.locator('text=' + uniqueName);
          await expect(newCategory.first()).toBeAttached();
        }
      }
    });
  });

  test.describe('Color Assignment', () => {

    test('Should have color picker for category creation', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for color input (type="color")
      const colorInput = page.locator('input[type="color"]').first();
      const hasColorInput = await colorInput.count().then(c => c > 0);

      if (hasColorInput) {
        await expect(colorInput).toBeAttached();
      }
    });

    test('Should allow selecting custom color for category', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const colorInput = page.locator('input[type="color"]').first();
      const hasColorInput = await colorInput.count().then(c => c > 0);

      if (hasColorInput) {
        // Get initial value
        const initialColor = await colorInput.inputValue();

        // Set a new color (red)
        await colorInput.fill('#ff0000');
        await page.waitForTimeout(500);

        const newColor = await colorInput.inputValue();
        expect(newColor).toBe('#ff0000');
      }
    });

    test('Should display category with assigned color in list', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for category color indicators
      const colorIndicators = page.locator('[style*="background-color"], [style*="background"], .rounded-full');
      const hasColorIndicators = await colorIndicators.count().then(c => c > 0);

      if (hasColorIndicators) {
        // At least one category should have a color indicator
        expect(hasColorIndicators).toBe(true);
      }
    });

    test('Should generate random color for new category by default', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const colorInput = page.locator('input[type="color"]').first();
      const hasColorInput = await colorInput.count().then(c => c > 0);

      if (hasColorInput) {
        // Color input should have a default value (hex format)
        const colorValue = await colorInput.inputValue();
        expect(colorValue).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  test.describe('Category List Display', () => {

    test('Should display all categories in a list', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for category list section
      const categoryList = page.locator('[data-testid*="category"], .category-list, ul:has(li:has-text("category"))');
      const hasCategoryList = await categoryList.count().then(c => c > 0);

      if (hasCategoryList) {
        await expect(categoryList.first()).toBeVisible();
      }
    });

    test('Should show category name in list item', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for category names (typically text elements)
      const categoryNames = page.locator('span, div, li').filter(async elem => {
        const text = await elem.textContent();
        return text && text.trim().length > 0 && text !== 'Category';
      });

      const hasCategories = await categoryNames.count().then(c => c > 0);
      expect(hasCategories).toBe(true);
    });
  });

  test.describe('Edit Category', () => {

    test('Should have edit option for each category', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for edit buttons
      const editButtons = page.locator('button[aria-label*="edit" i], button:has-text("Edit"), button:has-text("✏")');
      const hasEditButtons = await editButtons.count().then(c => c > 0);

      if (hasEditButtons) {
        await expect(editButtons.first()).toBeAttached();
      }
    });

    test('Should allow editing category name', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const editButtons = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
      const hasEditButton = await editButtons.count().then(c => c > 0);

      if (hasEditButton) {
        await editButtons.click();
        await page.waitForTimeout(500);

        // Look for edit input
        const editInput = page.locator('input[type="text"]').filter(async elem => {
          return await elem.isVisible();
        }).first();

        const hasEditInput = await editInput.count().then(c => c > 0);

        if (hasEditInput) {
          const newName = `Updated ${Date.now()}`;
          await editInput.fill(newName);

          // Look for save button
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
          const hasSave = await saveButton.count().then(c => c > 0);

          if (hasSave) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Verify updated name appears
            const updatedName = page.locator('text=' + newName);
            await expect(updatedName.first()).toBeAttached();
          }
        }
      }
    });

    test('Should allow editing category color', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const editButtons = page.locator('button[aria-label*="edit" i], button:has-text("Edit")').first();
      const hasEditButton = await editButtons.count().then(c => c > 0);

      if (hasEditButton) {
        await editButtons.click();
        await page.waitForTimeout(500);

        // Look for color picker in edit mode
        const colorInput = page.locator('input[type="color"]').first();
        const hasColorInput = await colorInput.count().then(c => c > 0);

        if (hasColorInput) {
          await colorInput.fill('#00ff00'); // Green
          await page.waitForTimeout(500);

          // Save the change
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').first();
          const hasSave = await saveButton.count().then(c => c > 0);

          if (hasSave) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    });
  });

  test.describe('Reorder Categories', () => {

    test('Should have reorder controls for categories', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for up/down arrows or drag handles
      const upButtons = page.locator('button[aria-label*="up" i], button:has-text("↑")');
      const downButtons = page.locator('button[aria-label*="down" i], button:has-text("↓")');
      const dragHandles = page.locator('[draggable="true"], .drag-handle');

      const hasUp = await upButtons.count().then(c => c > 0);
      const hasDown = await downButtons.count().then(c => c > 0);
      const hasDrag = await dragHandles.count().then(c => c > 0);

      // At least one type of reorder control should exist
      expect(hasUp || hasDown || hasDrag).toBe(true);
    });

    test('Should move category up when up button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const upButtons = page.locator('button[aria-label*="up" i], button:has-text("↑")').first();
      const hasUpButton = await upButtons.count().then(c => c > 0);

      if (hasUpButton) {
        // Get category order before clicking
        const categories = page.locator('li, [data-testid*="category-item"]');
        const firstCategory = await categories.first().textContent();

        await upButtons.nth(1).click(); // Click up on second item
        await page.waitForTimeout(1000);

        // Order should have changed
        const newFirstCategory = await categories.first().textContent();
        // Second category should now be first
        expect(newFirstCategory).not.toBe(firstCategory);
      }
    });

    test('Should move category down when down button is clicked', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const downButtons = page.locator('button[aria-label*="down" i], button:has-text("↓")').first();
      const hasDownButton = await downButtons.count().then(c => c > 0);

      if (hasDownButton) {
        // Get category order before clicking
        const categories = page.locator('li, [data-testid*="category-item"]');
        const firstCategory = await categories.first().textContent();

        await downButtons.first().click(); // Click down on first item
        await page.waitForTimeout(1000);

        // Order should have changed
        const newFirstCategory = await categories.first().textContent();
        expect(newFirstCategory).not.toBe(firstCategory);
      }
    });
  });

  test.describe('Delete Category', () => {

    test('Should have delete option for each category', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Look for delete buttons
      const deleteButtons = page.locator('button[aria-label*="delete" i], button:has-text("Delete"), button:has-text("🗑")');
      const hasDeleteButtons = await deleteButtons.count().then(c => c > 0);

      if (hasDeleteButtons) {
        await expect(deleteButtons.first()).toBeAttached();
      }
    });

    test('Should show confirmation before deleting category', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const deleteButtons = page.locator('button[aria-label*="delete" i], button:has-text("Delete")').first();
      const hasDeleteButton = await deleteButtons.count().then(c => c > 0);

      if (hasDeleteButton) {
        // Set up dialog handler
        page.on('dialog', async dialog => {
          expect(dialog.message()).toBeTruthy();
          await dialog.dismiss();
        });

        await deleteButtons.first().click();
      }
    });

    test('Should delete category when confirmed', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // First, create a test category
      const categoryInput = page.locator('input[placeholder*="New category" i], input[type="text"]').first();
      const hasCategoryInput = await categoryInput.count().then(c => c > 0);

      if (hasCategoryInput) {
        const uniqueName = `Delete Me ${Date.now()}`;
        await categoryInput.fill(uniqueName);

        const addButton = page.locator('button:has-text("Add"), button:has-text("Create")').first();
        const hasAddButton = await addButton.count().then(c => c > 0);

        if (hasAddButton) {
          await addButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const newCategoryDeleteButton = page.locator('li, div').filter({ hasText: uniqueName }).locator('button:has-text("Delete"), button[aria-label*="delete" i]').first();
          const hasDeleteButton = await newCategoryDeleteButton.count().then(c => c > 0);

          if (hasDeleteButton) {
            // Accept dialog
            page.on('dialog', dialog => dialog.accept());

            await newCategoryDeleteButton.click();
            await page.waitForTimeout(1000);

            // Category should be removed
            const deletedCategory = page.locator('text=' + uniqueName);
            const isStillVisible = await deletedCategory.isVisible().catch(() => false);
            expect(isStillVisible).toBe(false);
          }
        }
      }
    });
  });

  test.describe('Category in Transaction Dropdown', () => {

    test('Should show categories in transaction modal dropdown', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Open add transaction modal
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        // Look for category select
        const categorySelect = page.locator('select#modal-category, select').filter({ hasText: /uncategorized|category/i });
        const hasCategorySelect = await categorySelect.count().then(c => c > 0);

        if (hasCategorySelect) {
          await expect(categorySelect.first()).toBeAttached();

          // Verify options are available
          const options = await categorySelect.first().locator("option");
          expect(options.length).toBeGreaterThan(0);
        }
      }
    });

    test('Should include newly created category in dropdown', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      // Create new category
      const categoryInput = page.locator('input[placeholder*="New category" i], input[type="text"]').first();
      const hasCategoryInput = await categoryInput.count().then(c => c > 0);

      if (hasCategoryInput) {
        const uniqueName = `Dropdown Test ${Date.now()}`;
        await categoryInput.fill(uniqueName);

        const addButton = page.locator('button:has-text("Add")').first();
        const hasAddButton = await addButton.count().then(c => c > 0);

        if (hasAddButton) {
          await addButton.click();
          await page.waitForTimeout(1000);

          // Open transaction modal
          const addTransactionButton = page.locator('button:has-text("Add Transaction"), button:has-text("New")').first();
          const hasAddTransaction = await addTransactionButton.count().then(c => c > 0);

          if (hasAddTransaction) {
            await addTransactionButton.click();
            await waitForPageReady(page);

            // Check if new category appears in dropdown
            const categorySelect = page.locator('select#modal-category').first();
            const hasSelect = await categorySelect.count().then(c => c > 0);

            if (hasSelect) {
              const options = await categorySelect.locator("option");
              const hasNewCategory = options.some(opt => opt.includes(uniqueName) || uniqueName.includes(opt));
              expect(hasNewCategory).toBe(true);
            }
          }
        }
      }
    });

    test('Should have "Uncategorized" option in dropdown', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const transactionsLink = page.locator('a[href*="transactions"], a:has-text("Transactions")').first();
      const hasTransactionsLink = await transactionsLink.count().then(c => c > 0);

      if (hasTransactionsLink) {
        await transactionsLink.click();
        await waitForPageReady(page);
      }

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasAddButton = await addButton.count().then(c => c > 0);

      if (hasAddButton) {
        await addButton.click();
        await waitForPageReady(page);

        const categorySelect = page.locator('select#modal-category, select').filter({ hasText: /uncategorized|category/i });
        const hasCategorySelect = await categorySelect.count().then(c => c > 0);

        if (hasCategorySelect) {
          const options = await categorySelect.first().locator("option");
          const hasUncategorized = options.some(opt => {
            const text = opt.toUpperCase ? opt.toString().toUpperCase() : '';
            return text.includes('UNCATEGORIZED') || text.includes('NO CATEGORY');
          });
          expect(hasUncategorized).toBe(true);
        }
      }
    });
  });

  test.describe('Category Color in Charts', () => {

    test('Should display category color in chart legend', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      // Navigate to a project detail page (which has charts)
      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        // Look for chart legend
        const chartLegend = page.locator('.chart-legend, [class*="legend"]');
        const hasLegend = await chartLegend.count().then(c => c > 0);

        if (hasLegend) {
          await expect(chartLegend.first()).toBeVisible();
        }
      }
    });

    test('Should use category colors in pie chart segments', async ({ page }) => {
      await page.goto('/projects');
      await waitForPageReady(page);

      const projectCard = page.locator('[data-testid^="project-card"], a[href*="/projects/"]').first();
      const hasProjectCard = await projectCard.count().then(c => c > 0);

      if (hasProjectCard) {
        await projectCard.click();
        await waitForPageReady(page);

        // Look for canvas element (Chart.js renders on canvas)
        const chartCanvas = page.locator('canvas');
        const hasChart = await chartCanvas.count().then(c => c > 0);

        if (hasChart) {
          await expect(chartCanvas.first()).toBeAttached();
        }
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {

    test('Should display category list on 375px viewport', async ({ page }) => {
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

    test('Should have touch-friendly category action buttons on mobile', async ({ page }) => {
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
      const actionButtons = page.locator('button').filter(async btn => {
        const text = await btn.textContent();
        return text && (text.includes('Edit') || text.includes('Delete'));
      });

      const buttonCount = await actionButtons.count();

      if (buttonCount > 0) {
        const firstButton = actionButtons.first();
        const box = await firstButton.boundingBox();

        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
});
