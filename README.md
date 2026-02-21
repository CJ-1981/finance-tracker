# Finance Tracker

A collaborative financial tracking web application built with React, TypeScript, and Supabase.

## Features

- OAuth Authentication with Google
- Project-based financial tracking
- Real-time transaction synchronization
- Interactive dashboard with charts
- CSV export for accounting software
- Mobile-responsive design
- Multi-user collaboration with role-based access control

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6
- **CSV Export**: PapaParse
- **Deployment**: GitHub Pages

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project with Google OAuth enabled

### Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings → API
3. Copy your Project URL and anon/public key
4. Go to Authentication → Providers and enable Google OAuth
5. Go to the SQL Editor and run the schema from `database/schema.sql`

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser

5. Enter your Supabase credentials in the configuration screen

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

### GitHub Pages

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
- `projects`: Financial tracking projects
- `project_members`: Project membership with roles (owner, member, viewer)
- `categories`: Transaction categories
- `transactions`: Financial transactions
- `invitations`: User invitations
- `audit_logs`: Audit trail

See `database/schema.sql` for the complete schema including RLS policies.

## Usage

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Create Project**: Create a new project to track finances
3. **Add Transactions**: Add transactions with amount, category, and description
4. **View Analytics**: See spending breakdown by category in charts
5. **Export Data**: Export transactions as CSV for accounting software
6. **Invite Members**: Invite collaborators to your project (owner only)

## Project Structure

```
finance-tracker/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Supabase client and config
│   ├── types/         # TypeScript type definitions
│   ├── utils/         # Utility functions
│   ├── App.tsx        # Main app with routing
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── database/          # SQL schema
├── public/            # Static assets
└── index.html         # HTML template
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [API Documentation](docs/api.md) - Complete API reference and database schema
- [User Guide](docs/user-guide.md) - Step-by-step user instructions
- [Developer Guide](docs/developer-guide.md) - Development setup and architecture
- [Deployment Guide](docs/deployment-guide.md) - Production deployment instructions
- [Changelog](CHANGELOG.md) - Version history and updates

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. See the [Developer Guide](docs/developer-guide.md) for contribution guidelines.
