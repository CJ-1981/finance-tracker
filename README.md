# Finance Tracker

A collaborative financial tracking web application built with React, TypeScript, and Supabase.

**Live Demo:**
- [Finance Tracker](https://cj-1981.github.io/finance-tracker/)
- [Cash Counter (No Auth Required)](https://cj-1981.github.io/finance-tracker/#/cashcounter)

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
- **Standalone Cash Counter Page** - Public cash counter accessible without authentication
  - Multi-currency support (EUR, USD, GBP, JPY, KRW, CNY, INR)
  - Language selector (English/Korean)
  - Target amount comparison with match/excess/shortage status
  - Export to clipboard in Markdown format
  - Daily data reset
  - Accessible at `/cashcounter` route
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
- **Multi-user collaboration** - Invite members with role-based access (owner, admin, member, viewer)
- **Email invitations** - Send invitations with token-based acceptance flow (owner and admin)
- **QR Code Invitations** - Generate QR codes for easy invitation sharing
  - Display QR code in invite success modal
  - Copy QR code image to clipboard for email sharing
  - Dark mode support for QR display
- **QR Code Config Scanner** - Scan QR codes to configure Supabase settings
  - Camera-based QR code scanner with live preview
  - **File upload support** - Scan QR codes from saved images (no camera required)
  - Image preview before decoding
  - Support for all common image formats (JPG, PNG, etc.)
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
- **QR Codes**: react-qr-code, qr-scanner, jsQR (image-based scanning)
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
4. Go to SQL Editor and run schema from `database/schema.sql`

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

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:5173/](http://localhost:5173/) in your browser

5. **Create a Supabase account (if you don't have one):**
   - Go to [supabase.com](https://supabase.com) and sign up
   - Create a new project
   - Copy your Project URL and anon key

6. **Configure** app:
   - Click "Get Started" on landing page
   - **Option 1**: Scan QR code containing Supabase config
     - Use camera for live scanning (requires HTTPS or localhost)
     - Or upload QR code image file (no camera required)
   - **Option 2**: Manually enter your Supabase Project URL and anon key
   - Click "Save Configuration"

7. **Sign in with your Supabase credentials:**
   - Enter email and password you use for Supabase
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

The built files will be in `dist/` directory.

## Deployment

### GitHub Pages

This project is configured for GitHub Pages deployment. The live site is available at:
[https://cj-1981.github.io/finance-tracker/](https://cj-1981.github.io/finance-tracker/)

To deploy your own fork:

1. Update `vite.config.ts` with your repository name:
```typescript
base: '/your-repo-name/',
```

2. Install GitHub Pages deployment tool:
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
   - Add your GitHub Pages URL to Redirect URLs
   - Example: `https://yourusername.github.io/finance-tracker/`

## Database Schema

The application uses the following tables:

- `profiles`: User profiles (extends Supabase Auth)
- `projects`: Financial tracking projects with settings and custom fields
- `project_members`: Project membership with roles (owner, admin, member, viewer)
- `categories`: Transaction categories with colors and order
- `transactions`: Financial transactions with multi-currency support and custom data
- `invitations`: User invitations with status tracking (pending/accepted/expired)
- `audit_logs`: Audit trail

**Key Features:**
- Custom fields support via `custom_data` JSONB column
- Multi-currency via `currency_code` column
- Category ordering via `order` column
- Invitation status tracking for better UX

See `database/schema.sql` for complete schema including RLS policies.

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
   - Select transaction type (Income or Expense) using segmented control
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

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes, updates, and bug fixes.

## Documentation

For comprehensive documentation, see `docs/` directory:
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
- Code follows existing style
- Database changes include migration scripts
- Features are tested before submission
