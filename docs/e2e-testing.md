# E2E Testing Guide

This guide covers the End-to-End (E2E) testing framework implemented for the Finance Tracker application using Playwright.

## Overview

The E2E testing framework provides comprehensive cross-browser testing for the application, with special focus on mobile responsiveness and user interactions.

### Key Features
- **Cross-browser testing** (Chrome, Firefox, Safari, Edge)
- **Mobile viewport testing** (320px-375px)
- **Touch interaction testing**
- **Performance monitoring**
- **Automated CI/CD integration**

## Testing Setup

### Prerequisites
- Node.js 18+ and npm
- Playwright browsers (automatically installed)

### Install Dependencies
```bash
npm install
```

### Install Playwright Browsers
```bash
npx playwright install
```

## Test Execution

### Run All Tests
```bash
npm run test:e2e
```

### Run Tests in CI Mode
```bash
npm run test:e2e:ci
```

### Run Specific Test File
```bash
npx playwright test tests/mobile.spec.ts
```

### Run Tests with Specific Browser
```bash
npx playwright test --project=chromium
```

### Run Tests in Headed Mode (visible browser)
```bash
npx playwright test --headed
```

## Test Structure

### Mobile Tests (`tests/mobile.spec.ts`)
Tests mobile-specific functionality including:
- Mobile viewport responsiveness
- Touch target sizes (≥44px)
- Horizontal overflow prevention
- Icon button interactions
- Mobile form inputs

### Authentication Tests (`tests/auth.spec.ts`)
Tests authentication flows:
- Login page functionality
- Sign up process
- Session management
- Error handling

### Project Tests (`tests/projects.spec.ts`)
Tests project management features:
- Project creation
- Project switching
- Member management
- Settings configuration

## Mobile-Specific Tests

### Viewport Testing
```typescript
test('Mobile viewport (320px) should display correctly', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 667 });
  await page.goto('/');
  // Test mobile-specific elements
});
```

### Touch Target Validation
```typescript
test('All interactive elements meet 44px touch target', async ({ page }) => {
  await page.goto('/projects');
  const buttons = await page.$$eval('button', buttons =>
    buttons.map(btn => ({
      text: btn.textContent?.trim(),
      width: btn.offsetWidth,
      height: btn.offsetHeight
    }))
  );

  buttons.forEach(btn => {
    expect(btn.width).toBeGreaterThanOrEqual(44);
    expect(btn.height).toBeGreaterThanOrEqual(44);
  });
});
```

### Horizontal Overflow Prevention
```typescript
test('Should not have horizontal overflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/projects');

  // Check for horizontal scrollbar
  const scrollWidth = await page.evaluate(() =>
    document.documentElement.scrollWidth
  );
  const clientWidth = await page.evaluate(() =>
    document.documentElement.clientWidth
  );

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
```

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## CI/CD Integration

### GitHub Actions (`.github/workflows/test.yml`)
```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:ci
```

## Performance Testing

### Mobile Performance Metrics
```typescript
test('Mobile page load performance', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/');
  const loadTime = Date.now() - startTime;

  // Assert load time is under 3 seconds
  expect(loadTime).toBeLessThan(3000);
});
```

## Debugging

### View Trace
```bash
npx playwright show-trace trace.zip
```

### Run with Debug Mode
```bash
PWDEBUG=1 npx playwright test
```

### Take Screenshots on Failure
```typescript
test('Example test', async ({ page }) => {
  try {
    await page.goto('/');
    // Test logic
  } catch (error) {
    await page.screenshot({ path: 'failure.png' });
    throw error;
  }
});
```

## Best Practices

1. **Mobile-First Testing**: Always test on mobile viewports first
2. **Touch Targets**: Ensure all interactive elements are ≥44px
3. **Performance**: Monitor load times on mobile devices
4. **Cross-Browser**: Test on all major browsers
5. **Accessibility**: Follow WCAG 2.1 AA standards
6. **Error Handling**: Test error scenarios and user feedback

## Continuous Integration

The E2E tests are automatically triggered on:
- Push to main branch
- Pull requests targeting main
- Manual runs in CI/CD pipeline

Test results are reported through:
- GitHub Actions logs
- HTML reports
- Slack notifications (if configured)

## Troubleshooting

### Common Issues

1. **Element Not Found**
   - Check element selectors
   - Add proper waits
   - Use Playwright auto-waiting

2. **Mobile Viewport Issues**
   - Verify viewport size
   - Check responsive breakpoints
   - Test on multiple devices

3. **Performance Issues**
   - Check network conditions
   - Monitor resource loading
   - Optimize asset sizes

### Useful Commands

```bash
# Update Playwright
npm install @playwright/test@latest

# Install specific browsers
npx playwright install chromium firefox webkit

# Clean install
npx playwright install --clean

# Show report
npx playwright show-report
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mobile Web Best Practices](https://developers.google.com/web/fundamentals/)