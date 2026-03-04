# Finance Tracker

A collaborative financial tracking web application built with React, TypeScript, and Supabase.

**Live Demo:** [https://cj-1981.github.io/finance-tracker/](https://cj-1981.github.io/finance-tracker/)

## Features

- **Email/Password Authentication** - Sign up and sign in with email
- **Landing page** - Welcome screen with sign in/sign up buttons
- **Project-based financial tracking** - Organize finances by project
- **Cash Counter Modal** - Count cash bills and coins with comparison to transaction records
  - EUR bill/coin support (200€ to 0.01€)
  - Anonymous and named entry categories
  - Bills/coins breakdown with color-coded match status
  - Mobile-friendly +/- buttons and direct input
  - localStorage persistence with auto-clear
- **Soft Delete with Recovery** - Recover deleted transactions within 1 year
  - Soft delete instead of permanent deletion
  - Restore deleted transactions functionality
  - "Show Deleted" / "Hide Deleted" toggle for owners
  - Bulk delete uses soft delete for consistency
- **Income/Expense Selector** - Mobile-friendly segmented control for transaction types
  - No minus sign needed on mobile keyboards
  - Visual color coding (green for income, red for expense)
  - Automatic sign handling in database
- **Date period filtering** - View analytics by today, custom ranges, all-time
- **Interactive dashboard with charts** - Visual spending breakdown by category
  - Pie chart for amount by category
  - Area plot for amount over time by category (cumulative/absolute toggle)
  - Hides time-based charts for single-day views
- **Multi-currency support** - Track transactions in USD, EUR, GBP, JPY, KRW, CNY, INR
- **Custom fields** - Add custom text/number/date/select fields per project
- **Custom field autocomplete** - Import known values for faster data entry
- **Dropdown list support** - Create select fields with predefined options
- **Category management** - Create, rename, reorder categories with color coding
- **CSV export** - Export transactions matching table structure
- **Multi-user collaboration** - Invite members with role-based access (owner, member, viewer)
- **Email invitations** - Send invitations with token-based acceptance flow (owner only)
- **QR Code Invitations** - Generate QR codes for easy invitation sharing
  - Display QR code in invite success modal
  - Copy QR code image to clipboard for email sharing
  - Dark mode support for QR display
- **QR Code Config Scanner** - Scan QR codes to configure Supabase settings
  - Camera-based QR code scanner with live preview
  - Automatic config extraction from scanned codes
  - HTTPS detection and camera permission handling
  - Graceful fallback to manual input
- **Full internationalization** - English and Korean language support
  - Browser language detection
  - Localized UI elements and chart labels
- **Mobile-responsive design** - Works seamlessly on all devices
  - No horizontal overflow on mobile (320px-375px)
  - Touch targets ≥44px meeting WCAG 2.1 AA standards
  - E2E testing with Playwright for mobile interactions
  - Icon-only buttons for space optimization on small screens

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v7
- **Internationalization**: i18next with react-i18next
- **QR Codes**: react-qr-code, qr-scanner
- **CSV Export**: PapaParse
- **Date Handling**: Native browser date pickers
- **Testing**: Vitest (unit), Playwright (E2E)
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project
- Playwright (for E2E testing, optional)

### Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings → API
3. Copy your Project URL and anon/public key
4. Go to the SQL Editor and run the schema from `database/schema.sql`

**Important:** For existing databases, ensure you have the latest schema and run `database/migration_soft_delete_transactions.sql` to enable soft delete functionality.

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/CJ-1981/finance-tracker.git
cd finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173/](http://localhost:5173/) in your browser

5. **Create a Supabase account (if you don't have one):**
   - Go to [supabase.com](https://supabase.com) and sign up
   - Create a new project
   - Copy your Project URL and anon key

6. **Configure the app:**
   - Click "Get Started" on the landing page
   - **Option 1**: Scan QR code containing Supabase config (requires HTTPS or localhost)
   - **Option 2**: Manually enter your Supabase Project URL and anon key
   - Click "Save Configuration"

7. **Sign in with your Supabase credentials:**
   - Enter the email and password you use for Supabase
   - Click "Sign In"

### Testing

```bash
# Run development server
npm run dev

# Run unit tests (Vitest)
npm test

# Run unit tests with coverage
npm test -- --coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Run tests in CI/CD mode
npm run test:e2e:ci
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### GitHub Pages

This project is configured for GitHub Pages deployment. The live site is available at:
[https://cj-1981.github.io/finance-tracker/](https://cj-1981.github.io/finance-tracker/)

To deploy your own fork:

1. Update `vite.config.ts` with your repository name:
```typescript
base: '/your-repo-name/',
```

2. Install the GitHub Pages deployment tool:
```bash
npm install -D gh-pages
```

3. Add deploy scripts to `package.json`:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist",
    "deploy:force": "gh-pages -d dist --force"
  }
}
```

4. Deploy:
```bash
npm run deploy
```

5. Configure your Supabase project:
   - Go to Authentication → URL Configuration
   - Add your GitHub Pages URL to the Redirect URLs
   - Example: `https://yourusername.github.io/finance-tracker/`

## Database Schema

The application uses the following tables:

- `profiles`: User profiles (extends Supabase Auth)
- `projects`: Financial tracking projects with settings and custom fields
- `project_members`: Project membership with roles (owner, member, viewer)
- `categories`: Transaction categories with colors and order
- `transactions`: Financial transactions with multi-currency support and custom data
- `invitations`: User invitations with status tracking (pending/accepted/expired)
- `audit_logs`: Audit trail

**Key Features:**
- Custom fields support via `custom_data` JSONB column
- Multi-currency via `currency_code` column
- Category ordering via `order` column
- Invitation status tracking for better UX

See `database/schema.sql` for the complete schema including RLS policies.

## Usage

1. **Sign Up/Sign In**: Create account with email and password
2. **Configure Supabase**: Scan QR code or manually enter Supabase project credentials
3. **Create Project**: Create a new project to track finances
4. **Configure Settings**:
   - Set default currency (USD, EUR, KRW, etc.)
   - Add custom fields (e.g., "이름" for names)
   - Import known values for custom fields
5. **Add Categories**: Create categories with colors, reorder as needed
6. **Add Transactions**:
   - Select transaction type (Income or Expense) using the segmented control
   - Enter positive amount (no minus sign needed)
   - Choose currency
   - Select category
   - Fill in custom fields with autocomplete
7. **Filter by Date**: Use period selector to view specific time ranges
8. **View Analytics**: See spending breakdown by category in charts
9. **Export Data**: Export transactions as CSV for accounting software
10. **Invite Members**:
    - Send email invitations to collaborators (owner only)
    - Generate QR code for easy invitation sharing
    - Copy QR code image to paste into emails

## Project Structure

```
finance-tracker/
├── src/
│   ├── components/         # Reusable components
│   │   ├── QRCodeDisplay.tsx      # QR code generation component
│   │   └── QRScannerModal.tsx     # Camera-based QR scanner
│   ├── components/__tests__/ # Component unit tests (Vitest)
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Supabase client and utilities
│   │   ├── invitations.ts # Invitation management utilities
│   │   └── inviteConfig.ts # Invite config encoding/decoding
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   │   └── csvExport.ts    # CSV export functionality
│   ├── test/              # Test setup and utilities
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── database/              # SQL schema and setup scripts
│   ├── schema.sql                            # Master schema (for new databases)
│   ├── migration_soft_delete_transactions.sql # Soft delete system
│   └── SETUP-GUIDE.md                        # Database setup instructions
├── public/                # Static assets
└── index.html             # HTML template
```

## Recent Updates

### v2.5.0 - QR Code for Invitations & Config Setup (Issue #24)

**New Features:**
- ✅ QR Code for Invitations (SPEC-QR-001)
  - QR code display in invite success modal
  - Copy QR code image to clipboard for email sharing
  - Automatic QR code generation from invite URL
  - Dark mode support for QR display
- ✅ QR Code Scanner for Config Setup (SPEC-QR-001)
  - Camera-based QR code scanner in ConfigPage
  - Automatic config extraction from scanned QR codes
  - HTTPS detection and warning for camera API requirements
  - Camera permission handling with clear user feedback
  - Graceful fallback to manual input when camera unavailable

**Technical:**
- New dependencies: `react-qr-code@^2.0.18`, `qr-scanner@^1.4.2`
- Components: `QRCodeDisplay.tsx`, `QRScannerModal.tsx`
- i18n translations for QR features (English, Korean)
- Camera API integration with proper resource cleanup
- Memory leak prevention with mounted flags and refs
- Config validation and extraction from invite URLs
- Unit tests: 22 tests (13 for QRCodeDisplay, 9 for QRScannerModal)

### v2.4.0 - Dark Theme Support & Landing Page Improvements

**New Features:**
- ✅ System-wide dark mode with manual toggle option
  - Dark/light mode toggle in ConfigPage settings
  - Respects system preference (auto-detect) on first visit
  - Persists user preference across sessions via localStorage
  - Smooth transitions between themes
  - Full Tailwind CSS dark mode implementation
  - All pages and components support dark theme
  - Charts adapt to dark theme with appropriate colors
- ✅ Landing page language selector (fixes #23)
  - Users can switch between English and Korean before logging in
  - Positioned in top-right corner for easy access

**Improvements:**
- ✅ Supabase sign-up clarity (fixes #23)
  - Login page toggle text updated to mention Supabase
  - "Don't have an account? Sign Up" → "Don't have an account? Sign Up with Supabase"
  - "계정이 없으신가요? 회원가입" → "계정이 없으신가요? Supabase로 회원가입"
  - Improved user understanding of authentication provider

**Bug Fixes:**
- ✅ Dark Theme UI Glitches (fixes #22) - Comprehensive dark theme fixes across all pages
  - "Show Deleted" button now has proper dark mode styling
  - Table headers with appropriate background colors in dark mode
  - Currency highlighting adjustments for dark theme readability
  - Row dividers visible in both light and dark themes
  - Category names properly styled in dark mode
  - Rename/delete buttons with dark mode hover states
  - Navigation arrows visible in dark theme
  - Custom fields panel with proper dark mode backgrounds
  - "Clear App Config" button dark mode variants
  - Logout button with appropriate dark mode styling

**Technical:**
- Dark mode implementation using Tailwind CSS `dark:` variants
- Theme context provider for global theme management
- localStorage persistence for theme preference
- System preference detection using `prefers-color-scheme`
- CSS custom properties for theme-aware colors

### v2.3.5 - Multi-Currency Support & UX Improvements

**New Features:**
- ✅ Multi-Currency Transaction Filtering (SPEC-CURRENCY-001)
  - Filter transactions by project currency for accurate calculations
  - Case-insensitive and whitespace-normalized currency matching
  - Visual indicators for mismatched currencies in transaction list
  - Tooltip explanations for currency exclusions
- ✅ Other Currency Totals Display
  - Shows breakdown of amounts by non-matching currencies
  - Displays in Total Amount widget below main total
  - Sorted alphabetically by currency code
- ✅ Transaction Modal UX Improvements
  - Close button (X) on top-right corner for easy dismissal
  - "Save & Continue" button for rapid data entry workflow
  - Modal stays open for adding multiple transactions in sequence
- ✅ Persistent Transaction Type Selection
  - Income/expense button state remembered across modal openings
  - Stored in localStorage for session persistence
  - Defaults to income when adding new transactions
  - Defaults to "With Names" in Cash Counter modal

**Bug Fixes:**
- ✅ Chart currency filtering - Pie charts now exclude mismatched currencies
- ✅ Recent transactions currency display - Shows actual transaction currency
- ✅ Swapped Cash Counter Modal button positions (With Names first)

**Technical:**
- Currency filtering utility functions: `getCurrencyStatus()`, `filterByCurrency()`, `isTransactionIncluded()`
- Transaction status indicator component with visual warnings
- Case-insensitive currency comparison with whitespace normalization

### v2.3.4 - Mobile Responsiveness & Safety Improvements

**New Features:**
- ✅ Delete transaction loading spinner for visual feedback
- ✅ Safety check system with hash-based validation and auto-retry
  - Detects suspicious "0 data" results
  - Automatically retries with client reset
  - Prevents false empty results

**Improvements:**
- ✅ Reduced request timeout from 5s → 3s → 2s for faster feedback
- ✅ Debug panel now persists at bottom of screen when enabled
- ✅ Enhanced state sync across pages via storage event listeners

**Bug Fixes:**
- ✅ Fixed ProjectDetailPage mobile overflow (header, charts, transactions)
- ✅ Fixed TransactionsPage settings modal mobile overflow
- ✅ Fixed custom fields panel narrow width and overlapping issues
- ✅ Fixed projects array clearing during retry attempts
- ✅ Fixed debug panel reactivity with localStorage state sync

**Mobile Responsiveness:**
- All modals and pages now properly adapt to 375px screens
- Vertical stacking on mobile for settings panel items
- Improved button wrapping and spacing

### v2.3.3 - Connection Retry & Debug Panel Improvements

**Improvements:**
- ✅ Debug panel toggle moved to ConfigPage settings menu
- ✅ Debug panel now stays visible after loading completes
- ✅ Enhanced state sync across pages via storage event listeners

**Bug Fixes:**
- ✅ Fixed retry logic with Supabase client reset for stale connections
- ✅ Fixed session error retry handling (now throws instead of returning false)
- ✅ Fixed "No projects available" showing during successful retry
- ✅ Improved loading state management by removing finally blocks
- ✅ Expanded retry eligibility to Session, Network, and fetch errors

**Technical:**
- Added Supabase client reset before retry attempts
- Changed session errors to throw exceptions for proper retry triggering
- Projects array now preserved during retry attempts
- Explicit loading state management in success/error paths

### v2.3.0 - Cash Counter & Soft Delete System

**New Features:**
- ✅ Cash Counter Modal with EUR denomination support (200€ to 0.01€)
- ✅ Bills/coins breakdown with color-coded match status
- ✅ Anonymous and named entry categories
- ✅ Soft delete system with 1-year retention
- ✅ Transaction recovery functionality
- ✅ Enhanced security - invite restricted to owners
- ✅ Full Korean translation with browser language detection
- ✅ Mobile optimizations for iPhone 13 Pro

**Security Enhancements:**
- RPC authorization hardening for soft-delete functions
- Service role isolation for administrative operations
- Client-side authorization guards for multi-invite

**Technical:**
- Added `deleted_at` and `deleted_by` columns to transactions
- RPC functions for soft delete, restore, and permanent deletion
- Updated RLS policies for soft-deleted transaction handling
- Local timezone handling for date comparisons

**Database Migration Required:**
- Run `database/migration_soft_delete_transactions.sql` in Supabase SQL Editor

### v2.2.0 - Complete Mobile Responsiveness & E2E Testing

**New Features:**
- ✅ Complete mobile UI optimization (no horizontal overflow)
- ✅ E2E testing framework with Playwright
- ✅ Icon-only buttons for space optimization
- ✅ Touch targets ≥44px meeting WCAG 2.1 AA standards
- ✅ Responsive grids and text truncation for all screen sizes
- ✅ Fixed widget overflow in ProjectDetailPage
- ✅ Global mobile CSS optimizations

**Technical Improvements:**
- Playwright test suite for cross-browser testing
- Mobile viewport testing (320px-375px)
- Enhanced touch interaction handling
- Performance optimization for mobile devices
- Complete test automation pipeline

### v2.1.0 - Mobile-Enhanced Transaction Entry

**New Features:**
- ✅ Income/Expense segmented control - Mobile-friendly toggle for transaction types
- ✅ Color-coded transaction amounts - Green for income, red for expense
- ✅ Simplified mobile entry - No minus sign needed on number keyboards
- ✅ Automatic type detection - Edit mode detects expense/income from existing amounts

**UI Improvements:**
- Segmented control with large touch targets for mobile
- Dynamic amount field styling based on transaction type
- Absolute value display (no minus sign visible) throughout the app
- Enhanced visual feedback for transaction types

**Technical:**
- No database changes required - backward compatible
- Sign transformation handled at application layer
- Expenses stored as negative, income as positive

### v2.0.0 - Major Feature Release

**New Features:**
- ✅ Email/password authentication (replaced Google OAuth)
- ✅ Email invitation system with token-based acceptance
- ✅ Date period filtering on project dashboard
- ✅ Custom field autocomplete with bulk import
- ✅ Category sorting with drag-to-drop order
- ✅ Separated currency field from amount
- ✅ Enhanced CSV export matching table structure
- ✅ Wrong email UX improvements

**Database Changes:**
- Added `invitations` table with status tracking
- Added `currency_code` column to transactions
- Added `order` column to categories
- Added `custom_data` JSONB column for custom fields

**Migration:**
- For new databases: Run `database/schema.sql`
- Database should be up to date with all schema changes incorporated

## Documentation

For comprehensive documentation, see the `docs/` directory:
- [User Guide](docs/user-guide.md) - Getting started, account setup, project management
- [Developer Guide](docs/developer-guide.md) - Development setup, architecture, testing
- [API Documentation](docs/api.md) - Database schema, Supabase integration, CRUD operations
- [Deployment Guide](docs/deployment-guide.md) - Production deployment options and configuration
- [Architecture](docs/architecture.md) - System architecture and design decisions
- [E2E Testing](docs/e2e-testing.md) - End-to-end testing with Playwright

Also see `database/schema.sql` for:
- Complete database schema
- RLS (Row Level Security) policies
- Indexes for performance

## License

ISC

## Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style
- Database changes include migration scripts
- Features are tested before submission
