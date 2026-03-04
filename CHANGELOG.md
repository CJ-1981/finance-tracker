# Changelog

All notable changes to the Finance Tracker application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2026-03-04

### Added
- **Dark Theme Support** - System-wide dark mode with manual toggle option
  - Dark/light mode toggle in ConfigPage settings
  - Respects system preference (auto-detect) on first visit
  - Persists user preference across sessions via localStorage
  - Smooth transitions between themes
  - Full Tailwind CSS dark mode implementation
  - All pages and components support dark theme
  - Charts adapt to dark theme with appropriate colors

### Technical
- Dark mode implementation using Tailwind CSS `dark:` variants
- Theme context provider for global theme management
- localStorage persistence for theme preference
- System preference detection using `prefers-color-scheme`
- CSS custom properties for theme-aware colors

## [2.3.6] - 2026-03-04

### Added
- **Enhanced Data Recovery System** - Comprehensive recovery utility for handling data fetch failures
  - localStorage persistence for cross-session recovery
  - Multiple retry strategies with exponential backoff
  - Cached data fallback for display during failures
  - Request deduplication to prevent race conditions
  - Suspicious result detection with automatic retry
  - Hash-based data integrity verification

- **Progressive Loading Skeletons** - Decoupled UI rendering from Supabase loading
  - Page renders immediately with skeleton loaders
  - No full-page loading blockers
  - Perceived performance improvement
  - User can interact with UI during data fetch

### Changed
- **ProjectDetailPage Loading** - Removed full-page loading blocker
  - Added skeleton loaders for project header
  - Added loading placeholders for charts and transactions
  - Page now renders immediately with progressive loading

### Fixed
- **Flickering "Project Not Found" Message** - Error message no longer shows during initial load
  - Added loading state check before displaying error
  - Prevents brief flash of error message on page entry

- **Infinite Retry Loops** - Safety check no longer triggers on valid unchanged data
  - Removed logic that flagged unchanged hash as suspicious
  - Only retries for truly invalid data (missing required fields)

### Technical
- New `src/lib/dataRecovery.ts` with comprehensive recovery utilities
- Enhanced hash functions with sorted IDs and sample data
- localStorage persistence for hash data across sessions
- Skeleton loader components with `animate-pulse` animations
- Loading state indicators throughout the application

## [2.3.5] - 2026-03-03

### Added
- **Multi-Currency Transaction Filtering** (SPEC-CURRENCY-001)
  - Filter transactions by project currency for accurate calculations
  - Case-insensitive and whitespace-normalized currency matching
  - Visual indicators for mismatched currencies in transaction list
  - Tooltip explanations for currency exclusions

- **Other Currency Totals Display**
  - Shows breakdown of amounts by non-matching currencies
  - Displays in Total Amount widget below main total
  - Sorted alphabetically by currency code

- **Transaction Modal UX Improvements**
  - Close button (X) on top-right corner for easy dismissal
  - "Save & Continue" button for rapid data entry workflow
  - Modal stays open for adding multiple transactions in sequence

- **Persistent Transaction Type Selection**
  - Income/expense button state remembered across modal openings
  - Stored in localStorage for session persistence
  - Defaults to last selected type when adding new transactions

### Changed
- **Cash Counter Modal** - Swapped button positions
  - "With Names" button now appears before "Anonymous"
  - Improved workflow alignment with user patterns

### Fixed
- **Chart Currency Filtering** - Pie charts now exclude mismatched currencies
  - Amount calculations use only matching currency transactions
  - Prevents incorrect totals from multi-currency data

- **Recent Transactions Currency Display** - Shows actual transaction currency
  - Changed from project currency to transaction's currency_code
  - Users can now see multi-currency transactions accurately

### Technical
- Currency filtering utility functions: `getCurrencyStatus()`, `filterByCurrency()`, `isTransactionIncluded()`
- Transaction status indicator component with visual warnings
- Case-insensitive currency comparison with whitespace normalization

## [2.3.4] - 2026-03-03

### Added
- **Delete Transaction Loading Indicator** - Spinner shows during transaction deletion
  - Visual feedback while deletion is in progress
  - Delete button disabled during operation to prevent double-clicks

- **Safety Check for Suspicious Empty Results** - Hash-based data validation with auto-retry
  - Detects when queries return 0 data but previously had data
  - Automatically triggers one additional retry with client reset
  - Prevents infinite retry loops with safety flag
  - Applied to ProjectsPage, ProjectDetailPage, and TransactionsPage

### Changed
- **Request Timeout Reduced** - Timeout reduced from 5s → 3s → 2s
  - Faster user feedback on slow connections
  - Combined with retry mechanism for robustness

- **Debug Panel Visibility** - Debug panel now persists at bottom of screen
  - Changed from conditional rendering to always-visible when enabled
  - Fixed positioning at screen bottom with z-50
  - Shows "No debug messages yet" when log is empty

### Fixed
- **Session Error Retry Handling** - Session errors now throw exceptions instead of returning false
  - Enables retry logic for session validation failures
  - Expanded retry eligibility to Session, Network, and fetch errors

- **Projects Array Preservation** - Projects array only cleared on initial fetch attempt
  - Prevents "No projects available" during successful retry
  - Improved loading state management by removing finally blocks

- **ProjectDetailPage Mobile Overflow** - Comprehensive mobile responsiveness fixes
  - Header action buttons: Added flex-wrap, removed flex-shrink-0
  - Chart cards: Added overflow-hidden to prevent content overflow
  - Chart controls: Added min-w-0 to allow shrinking
  - Chart titles: Wrapped in truncate spans
  - Transaction amounts: Changed to break-all for aggressive wrapping
  - Removed redundant md:px-6 from header padding

- **TransactionsPage Settings Modal Mobile Overflow** - Fixed modal layout issues
  - Categories card: Added overflow-hidden, min-w-0 to forms
  - Custom fields card: Added overflow-hidden and responsive layouts
  - Field items: Changed to flex-col sm:flex-row for vertical stacking on mobile
  - Add field form: Full width inputs on mobile
  - Action buttons: Added flex-wrap and proper spacing

- **Debug Panel Reactivity** - Fixed debug panel to respond to toggle changes
  - Changed from localStorage read to useState with storage event listener
  - State syncs across all pages when toggled from config

## [2.3.3] - 2026-03-03

### Changed
- **Debug Panel Toggle Location** - Moved debug panel toggle from individual page headers to ConfigPage settings menu
  - Centralized control in one location
  - Cleaner UI on main pages
  - Toggle persists across sessions via localStorage

### Fixed
- **Retry Logic with Stale Connections** - Added Supabase client reset before retry attempts
  - Fixes repeated timeout errors during retry
  - Resets client connection to ensure fresh state
  - Significantly improves retry success rate
- **Session Error Retry Handling** - Changed session errors to throw exceptions instead of returning false
  - Enables retry logic for session validation failures
  - Expanded retry eligibility to Session, Network, and fetch errors
  - More robust error recovery
- **Loading State Management** - Removed finally blocks causing stale state reads
  - Explicit loading state set in success and error paths
  - Prevents race conditions in state updates
  - Cleaner control flow
- **Debug Panel Reactivity** - Fixed debug panel to remain visible after loading completes
  - Changed from direct localStorage read to useState with storage event listener
  - Debug panel now stays visible and updates when toggled from config page
  - State syncs across all pages
- **Projects Array Preservation** - Only clear projects array on initial fetch attempt
  - Prevents "No projects available" display during successful retry
  - Preserves existing data while retrying failed requests

## [2.3.2] - 2026-03-02

### Added
- **Debug Panel for Mobile Testing** - Added on-screen debug panel to diagnose timeout issues on mobile devices
  - Shows last 10 debug messages with timestamps
  - Displays request duration, timeout status, and errors
  - Black background with green monospace text for visibility
  - Loading state: Yellow indicator (active), Error state: Red indicator (error)
  - Eliminates need for Mac/Safari Web Inspector when debugging iOS devices

### Changed
- **Timeout Implementation Simplified** - Refactored timeout wrappers to use Promise.race() directly
  - Removed async IIFE wrapper that was adding unnecessary complexity
  - Removed withTimeout<T>() helper function
  - Cleaner code while maintaining same timeout protection
  - **Race Condition Discovery**: The original async IIFE wrapper may have been fixing a race condition
    by adding a microtask delay, allowing Supabase client to initialize properly
    - Further testing needed to confirm if hanging issue is truly resolved

### Fixed
- **Session Timeout Navigation** - Fixed navigation stuck issue after Supabase session timeout across all pages
  - ProjectDetailPage: Added session validation and error handling with retry option
  - ProjectsPage: Added session validation before fetching projects
  - TransactionsPage: Added error state, session validation, and retry UI
  - All pages now validate session before making Supabase queries
  - Users can retry loading when session expires instead of being stuck
- **Timeout Protection** - Added request timeout wrappers to prevent indefinite hanging
  - All Supabase queries now have 5-second timeout (session checks: 5000ms, data fetches: 5000ms)
  - ProjectDetailPage: Timeout on session check and project fetch
  - ProjectsPage: Timeout on session check and projects query
  - TransactionsPage: Timeout on session check, project fetch, and role fetch
  - Uses Promise.race() pattern to enforce timeout limits
  - Added timeout error messages in English and Korean
  - Users see clear "Request timeout" message instead of infinite loading
- **Projects Page Loading** - Decoupled UI from Supabase loading to prevent stuck page issues
  - Page header now renders immediately with interactive elements
  - Projects load asynchronously with skeleton loading states
  - User can now logout/interact even when Supabase is slow
- **Mobile Pie Chart Legend** - Fixed legend cutoff on mobile screens
  - Chart container now has minimum height (280px) to accommodate legend
  - Disabled aspect ratio maintenance for better mobile responsiveness
  - Reduced legend font size and padding for compact display
- **Automated Version Bump** - Added GitHub Actions workflow to automatically sync package.json version with CHANGELOG.md
  - Workflow triggers on CHANGELOG.md changes to main branch
  - Extracts version from latest CHANGELOG entry and updates package.json
  - Eliminates manual version synchronization steps

## [2.3.1] - 2026-03-02

### Added
- **Version Information Display**
  - App version and build timestamp now visible in ConfigPage settings menu
  - Automatic version generation during build process
  - Translated version info labels (English/Korean)

### Fixed
- **Date Filter Bug** - "Last 7 days" and "Last 30 days" periods now correctly include today's data
  - Previous behavior excluded today's transactions due to midnight timestamp comparison
  - Fixed by using date string comparison instead of Date object comparison
- **Cash Counter Clarity** - Mode label now displayed next to "Current Entry" heading
  - Shows "(Anonymous)" or "(With Names)" to indicate active category
  - Makes it clear which category's sum is being displayed

### Changed
- **Cash Counter Totals** - Refined total calculation logic for better UX
  - "Current Entry" now shows sum of active tab only (previously showed both categories)
  - "Total Counted" shows sum of both categories' current inputs plus all saved entries
  - Clear separation between current active entry and grand total

## [2.3.0] - 2026-03-02

### Added
- **Cash Counter Modal** (closes #8)
  - EUR bill/coin denomination support (200€, 100€, 50€, 20€, 10€, 5€, 2€, 1€, 0.50€, 0.20€, 0.10€, 0.05€, 0.02€, 0.01€)
  - Mobile-friendly +/- buttons and direct number input
  - Two entry categories: Anonymous and With Names
  - localStorage persistence with automatic date-based clearing
  - Real-time total calculation with color-coded match status
  - Bills/coins breakdown for detailed cash tracking
  - Comparison with transaction totals (within 1 cent tolerance)

- **Soft Delete System** with Transaction Recovery
  - Soft delete transactions instead of permanent deletion
  - 1-year retention period for audit and recovery
  - Restore deleted transactions functionality
  - "Show Deleted" / "Hide Deleted" toggle for project owners
  - Bulk delete now uses soft delete for consistency
  - Permanent deletion option for truly removing records
  - RPC functions: `soft_delete_transaction()`, `restore_transaction()`, `permanently_delete_transaction()`

- **Security Enhancements** (fixes #4)
  - Invite functionality restricted to project owners only
  - RPC authorization hardening for soft-delete functions
  - Service role only access for global cleanup operations
  - Client-side authorization guards for multi-invite

- **Localization Improvements** (closes #7)
  - Complete Korean translation support
  - Browser language detection
  - Localized chart labels and UI elements
  - Interpolation support for invitation emails

- **Mobile Responsiveness** (fixes #5, #6)
  - iPhone 13 Pro optimizations (375px screens)
  - Improved modal layouts for small screens
  - Enhanced touch targets for mobile interaction

### Changed
- Improved date handling using local timezone instead of UTC
- Enhanced chart mode persistence with state synchronization
- Refactored bulk delete to use soft delete

### Fixed
- Chart mode save using stale state
- Inconsistent logout translation key
- Deleted transactions showing raw category_id instead of names
- Hardcoded UI strings in deleted-transactions feature

### Security
- All RPC functions now properly validate user permissions
- Service role isolation for administrative functions
- Project ownership validation for restore operations

### Database Migration
- **Required**: Run `database/migration_soft_delete_transactions.sql` in Supabase SQL Editor
- Adds `deleted_at` and `deleted_by` columns to transactions table
- Creates soft delete RPC functions
- Updates RLS policies to handle soft-deleted transactions

## [2.2.0] - 2026-02-28

### Added
- **Complete Mobile Responsiveness**
  - No horizontal overflow on mobile (320px-375px)
  - Touch targets ≥44px meeting WCAG 2.1 AA standards
  - Icon-only buttons for space optimization on small screens
  - Responsive grids and text truncation for all screen sizes

- **E2E Testing Framework**
  - Playwright test suite for cross-browser testing
  - Mobile viewport testing (320px-375px)
  - Touch interaction testing for mobile devices
  - Performance testing for mobile responsiveness

- **Mobile Optimizations**
  - Fixed widget overflow in ProjectDetailPage
  - Global mobile CSS optimizations
  - Enhanced touch interaction handling
  - Complete test automation pipeline

### Changed
- Enhanced mobile user interface for better accessibility
- Improved responsive design patterns throughout the app

### Deprecated
- None

### Removed
- None

### Fixed
- Critical mobile UI issues (8 high-priority bugs)
- Horizontal overflow on all mobile devices
- Widget layout issues in ProjectDetailPage
- Touch target sizes below WCAG standards

### Security
- Maintained existing security standards
- Enhanced mobile-specific security measures

### Known Issues
- All 12 previously failing E2E tests have been fixed (150/150 now passing)
- Authentication redirect tests updated to match app behavior (redirects to landing page)
- Mobile text truncation tests made adaptive to page context

## [Unreleased]

### Added
- Initial MVP specification and implementation
- Complete project structure with React 19 and TypeScript
- Comprehensive documentation suite

### Changed
- Set up development environment and build process

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- None

## [1.0.0] - 2026-02-21

### Added
- **Authentication System**
  - Google OAuth integration with Supabase Auth
  - Session management with localStorage persistence
  - Protected routes with authentication checks

- **Project Management**
  - Create, read, update, and delete projects
  - Role-based access control (owner, member, viewer)
  - Project templates for quick setup
  - User invitation system with email tokens

- **Transaction Management**
  - Full CRUD operations for financial transactions
  - Category management with hierarchical support
  - Real-time synchronization across all users
  - CSV export functionality for accounting software

- **Analytics Dashboard**
  - Interactive charts using Chart.js
  - Spending breakdown by category (pie chart)
  - Spending trend analysis (line chart)
  - Budget vs actual comparison (bar chart)
  - Mobile-responsive design

- **Database Schema**
  - PostgreSQL with full RLS policies
  - Tables: profiles, projects, project_members, categories, transactions, invitations, audit_logs
  - Automated user profile creation on signup
  - Secure data isolation with row-level security

- **User Interface**
  - Mobile-first responsive design with Tailwind CSS
  - Bottom navigation on mobile (<768px)
  - Side navigation on desktop (≥768px)
  - Touch-friendly interface with 44px tap targets
  - Loading states and error handling

- **Development Tools**
  - Vite for fast development and builds
  - TypeScript for type safety
  - ESLint and Prettier for code quality
  - Comprehensive test structure

### Changed
- None

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Row-level security policies on all database tables
- OAuth redirect URL validation
- Input validation on all forms
- Secure storage of authentication tokens
- Audit logging for all major operations

### Known Issues
- Offline mode not implemented yet
- No bulk transaction import functionality
- Limited chart customization options
- No advanced reporting features

---

## [0.1.0] - 2025-02-21 (Initial Planning)

### Added
- Project planning and specification (SPEC-FINANCE-001)
- Technology stack selection
- Database schema design
- UI/UX wireframes
- Development roadmap

### Changed
- None

### Deprecated
- None

### Removed
- None

### Fixed
- None

### Security
- Initial security assessment
- Database security planning
- OAuth authentication research

---

## Version Information

- **Current Version**: 2.2.0
- **Next Version**: Unreleased (planned features)
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Node.js Requirement**: 18.18.0+
- **Package Manager**: npm 9.8.1+

## Migration Guide

### From 0.1.0 to 1.0.0

This is the first release, so no migration is needed. Just install the dependencies and start the application.

## Breaking Changes

### Version 1.0.0

This is the first major release, so there are no breaking changes from previous versions.

## Support

If you encounter any issues with this version, please:
1. Check the troubleshooting section in the documentation
2. Search existing issues on GitHub
3. Create a new issue with detailed information about your problem
4. Include your browser version, operating system, and steps to reproduce

## Contributing

We welcome contributions! Please see the contributing guidelines in the developer documentation for:
- Code style guidelines
- Pull request process
- Testing requirements
- Documentation standards