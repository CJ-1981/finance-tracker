# Finance Tracker

A collaborative financial tracking web application built with React, TypeScript, and Supabase.

**Live Demo:** [https://cj-1981.github.io/finance-tracker/](https://cj-1981.github.io/finance-tracker/)

## Features

- **Email/Password Authentication** - Sign up and sign in with email
- **Landing page** - Welcome screen with sign in/sign up buttons
- **Project-based financial tracking** - Organize finances by project
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
- **Email invitations** - Send invitations with token-based acceptance flow
- **Mobile-responsive design** - Works seamlessly on all devices
  - No horizontal overflow on mobile (320px-375px)
  - Touch targets ≥44px meeting WCAG 2.1 AA standards
  - E2E testing with Playwright for mobile interactions
  - Icon-only buttons for space optimization on small screens

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **CSV Export**: PapaParse
- **Date Handling**: Native browser date pickers
- **Testing**: Playwright (E2E)
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

**Important:** For existing databases, run `database/migrations/005_update_to_match_schema.sql` to update your schema.

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
   - Enter your Supabase Project URL and anon key
   - Click "Save Configuration"

7. **Sign in with your Supabase credentials:**
   - Enter the email and password you use for Supabase
   - Click "Sign In"

### Testing

```bash
# Run development server
npm run dev

# Run unit tests
npm test

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
2. **Create Project**: Create a new project to track finances
3. **Configure Settings**:
   - Set default currency (USD, EUR, KRW, etc.)
   - Add custom fields (e.g., "이름" for names)
   - Import known values for custom fields
4. **Add Categories**: Create categories with colors, reorder as needed
5. **Add Transactions**:
   - Select transaction type (Income or Expense) using the segmented control
   - Enter positive amount (no minus sign needed)
   - Choose currency
   - Select category
   - Fill in custom fields with autocomplete
6. **Filter by Date**: Use period selector to view specific time ranges
7. **View Analytics**: See spending breakdown by category in charts
8. **Export Data**: Export transactions as CSV for accounting software
9. **Invite Members**: Send email invitations to collaborators (owner only)

## Project Structure

```
finance-tracker/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Supabase client and utilities
│   │   ├── invitations.ts    # Invitation management utilities
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   │   └── csvExport.ts     # CSV export functionality
│   ├── App.tsx        # Main app with routing
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── database/          # SQL schema and migrations
│   ├── schema.sql              # Master schema (for new databases)
│   └── migrations/            # Migration scripts
│       ├── 001_initial_migrations.sql
│       ├── 002_invitation_cleanup.sql
│       ├── 003_add_payee_field.sql
│       ├── 004_add_currency_column.sql
│       └── 005_update_to_match_schema.sql
├── public/            # Static assets
└── index.html         # HTML template
```

## Recent Updates

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
- For existing databases: Run `database/migrations/005_update_to_match_schema.sql`

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
