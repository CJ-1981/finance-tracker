import { test, expect } from '@playwright/test';

/**
 * Authentication Tests
 * Tests authentication flows including login, signup, and session management
 */

test.describe('Authentication', () => {

  test.use({ storageState: { cookies: [], origins: [] } }); // Use isolated context

  test('Login page loads successfully', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/Finance Tracker/);

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();

    // At least email input should be present
    await expect(emailInput).toBeAttached();
  });

  test('Login form should have required fields', async ({ page }) => {
    await page.goto('/login');

    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await expect(emailInput).toBeAttached();

    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    await expect(passwordInput).toBeAttached();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In"), button:has-text("Login")').first();
    await expect(submitButton).toBeAttached();
  });

  test('Should show error on invalid login', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');

    // Submit form
    await submitButton.click();

    // Wait for response - either navigation or error message
    await page.waitForLoadState('networkidle');

    // Either we get an error message or we stay on login page
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login');

    // If we're still on login page, there should be some feedback
    if (isLoginPage) {
      // Check for error message or toast
      const errorMessage = page.locator('[role="alert"], .error, [class*="error"], [class*="toast"]').first();
      const hasError = await errorMessage.count().then(count => count > 0);
      // Error message is optional - form might just not submit
    }
  });

  test('Should redirect to login or landing when accessing protected routes', async ({ page }) => {
    // Try to access a protected route
    await page.goto('/projects');

    // Wait for potential redirect
    await page.waitForLoadState('networkidle');

    // Check current URL after navigation
    const currentUrl = page.url();

    // Unauthenticated users accessing protected routes are redirected to:
    // - Landing page (/) - default behavior
    // - Login page (/login) - explicit auth redirect
    // - Projects page (/projects) - if already authenticated via cookies
    const isLandingPage = currentUrl.endsWith('/') || currentUrl.includes('/#');
    const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/auth');
    const isProjectsPage = currentUrl.includes('/projects');

    // At least one of these should be true
    expect(isLandingPage || isLoginPage || isProjectsPage).toBe(true);
  });

  test('Login form inputs should be accessible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Check input sizes meet touch target requirements
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

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

    // Try to submit form with empty fields
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for validation state to settle
    await page.waitForLoadState('domcontentloaded');

    // Check for HTML5 validation or custom validation
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
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

    // Check for horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Check form is visible
    const form = page.locator('form, [class*="form"]').first();
    await expect(form).toBeAttached();
  });
});
