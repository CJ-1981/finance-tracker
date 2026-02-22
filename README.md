# Finance Tracker

A collaborative financial tracking web application built with React, TypeScript, and Supabase.

**Live Demo:** [https://cj-1981.github.io/finance-tracker/](https://cj-1981.github.io/finance-tracker/)

## Features

- **Email/Password Authentication** - Sign up and sign in with email
- **Landing page** - Welcome screen with sign in/sign up buttons
- **Project-based financial tracking** - Organize finances by project
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

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **CSV Export**: PapaParse
- **Date Handling**: Native browser date pickers
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project

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

5. **Important - Disable email confirmation (recommended for personal use):**
   - Go to your Supabase project dashboard
   - Navigate to **Authentication → Providers**
   - Click on **Email** provider
   - Under **Email confirmation**, turn off **Enable email confirmation**
   - Click **Save**

   Without this, users will need to confirm their email before signing in (which may not work depending on your email provider).

6. Sign up with email and password:
   - Click **"Don't have an account? Sign Up"** toggle
   - Enter your email and password
   - Click **Sign Up**
   - You'll be automatically signed in

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
   - Enter amount and select currency
   - Choose category
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

See `database/schema.sql` for:
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
