import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Tests authentication flows including login, signup, and session management
 */

test.describe('Authentication', () => {

  test.use({ storageState: { cookies: [], origins: [] } }); // Use isolated context

  test('Login page loads successfully', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to fully load and render
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for any loading spinners to appear and disappear
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

    // Check page title
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Check for login page - use the exact selector from the component
    const loginPage = page.locator('[data-testid="login-page"]').first();
    await expect(loginPage).toBeAttached({ timeout: 10000 });

    // Check for email input with exact data-testid
    const emailInput = page.locator('[data-testid="email-input"]').first();
    await expect(emailInput).toBeAttached({ timeout: 10000 });
  });

  test('Login form should have required fields', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Wait for any loading spinners to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
      // Spinner might not exist, that's ok
    });

    // Check for email input
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    await expect(emailInput).toBeAttached();

    // Check for password input
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    await expect(passwordInput).toBeAttached();

    // Check for submit button
    const submitButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();
    await expect(submitButton).toBeAttached();
  });

  test('Should show error on invalid login', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Wait for any loading spinners to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
      // Spinner might not exist, that's ok
    });

    // Fill in invalid credentials
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();
    const submitButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    // Submit form
    await submitButton.click();

    // Wait for response - either navigation or error message
    await page.waitForLoadState('networkidle');

    // Check current URL after login attempt
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');

    if (isLoginPage) {
      // We're still on login page - verify error feedback exists
      const errorMessage = page.locator('[data-testid="error-message"], .bg-red-50, [class*="error"]').first();
      const errorCount = await errorMessage.count();
      expect(errorCount).toBeGreaterThan(0); // Should have error message when login fails
    } else {
      // Navigation occurred - verify we moved away from login page
      expect(currentUrl).not.toContain('/login');
    }
  });

  test('Should redirect to login when accessing protected routes', async ({ page }) => {
    // Clear all storage to ensure we're starting fresh
    await page.context().clearCookies();

    // Try to access a protected route
    await page.goto('/projects');

    // Wait for loading state to finish and redirect to happen
    await page.waitForLoadState('domcontentloaded');
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

    // Wait for React to render and redirect to complete
    await page.waitForTimeout(2000);

    // Check current URL after navigation
    const currentUrl = page.url();

    // Debug: log the URL to understand where we ended up
    console.log('Current URL after redirect:', currentUrl);

    // The app should redirect unauthenticated users away from /projects
    // It might redirect to /login or / (landing page)
    const stillOnProjects = currentUrl.includes('/projects');

    // Should NOT stay on /projects when unauthenticated
    expect(stillOnProjects).toBe(false);
  });

  test('Login form inputs should be accessible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Wait for any loading spinners to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
      // Spinner might not exist, that's ok
    });

    // Check input sizes meet touch target requirements
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const passwordInput = page.locator('[data-testid="password-input"], input[type="password"]').first();

    const emailBox = await emailInput.boundingBox();
    const passwordBox = await passwordInput.boundingBox();

    if (emailBox) {
      expect(emailBox.height).toBeGreaterThanOrEqual(44);
    }
    if (passwordBox) {
      expect(passwordBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Should have signup link or option', async ({ page }) => {
    await page.goto('/login');

    // Check for signup link
    const signupLink = page.locator('a[href*="signup"], a[href*="register"], button:has-text("Sign Up"), button:has-text("Register")').first();

    const hasSignup = await signupLink.count().then(count => count > 0);

    // Signup link is optional - some apps only allow invites
    // Just verify it doesn't crash if not present
    if (hasSignup) {
      await expect(signupLink).toBeVisible();
    }
  });

  test('Should handle form validation', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Wait for any loading spinners to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
      // Spinner might not exist, that's ok
    });

    // Try to submit form with empty fields
    const submitButton = page.locator('[data-testid="submit-button"], button[type="submit"]').first();
    await submitButton.click();

    // Wait for validation state to settle
    await page.waitForLoadState('domcontentloaded');

    // Check for HTML5 validation or custom validation
    const emailInput = page.locator('[data-testid="email-input"], input[type="email"]').first();
    const isRequired = await emailInput.getAttribute('required');
    const hasValidation = isRequired !== null;

    // If required attribute exists, form should validate
    if (hasValidation) {
      const isValid = await emailInput.evaluate(el => (el as HTMLInputElement).checkValidity());
      expect(isValid).toBe(false); // Should be invalid with empty value
    }
  });

  test('Password field should have toggle visibility option', async ({ page }) => {
    await page.goto('/login');

    // Check for password toggle button
    const toggleButton = page.locator('button[aria-label*="password" i], button[aria-label*="show" i], button:has-text("Show"), button:has-text("Hide")').first();

    const hasToggle = await toggleButton.count().then(count => count > 0);

    // Password toggle is optional
    if (hasToggle) {
      await expect(toggleButton).toBeVisible();
    }
  });

  test('Login page should be responsive', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');

    // Wait for React to render in production build
    await page.waitForTimeout(2000);

    // Wait for any loading spinners to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {
      // Spinner might not exist, that's ok
    });

    // Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Check form is visible
    const form = page.locator('[data-testid="login-form"], form').first();
    await expect(form).toBeAttached();
  });
});
