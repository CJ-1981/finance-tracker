# Deployment Guide

This guide covers deploying the Finance Tracker application to GitHub Pages.

## Prerequisites

1. A GitHub repository with the project code
2. A Supabase project with Google OAuth configured
3. Node.js and npm installed locally

## Step 1: Configure GitHub Pages

### Option A: Using GitHub Actions (Recommended)

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. Push to GitHub and the workflow will automatically deploy

### Option B: Manual Deployment with gh-pages

1. Install gh-pages:
```bash
npm install -D gh-pages
```

2. Add deploy scripts to package.json:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist",
    "deploy:force": "gh-pages -d dist --force"
  }
}
```

3. Deploy:
```bash
npm run deploy
```

## Step 2: Configure Supabase

### 1. Enable Google OAuth

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Enable Google provider
4. Add your authorized redirect URL:
   - For GitHub Pages: `https://yourusername.github.io/finance-tracker/`
   - For local development: `http://localhost:3000/`

### 2. Configure Redirect URLs

1. Go to Authentication → URL Configuration
2. Add your site URLs to:
   - **Site URL**: Your production URL
   - **Redirect URLs**: Add both local and production URLs

### 3. Run Database Schema

1. Go to the SQL Editor in Supabase
2. Copy the contents of `database/schema.sql`
3. Run the SQL script to create tables and RLS policies

## Step 3: Update Vite Config

Make sure `vite.config.ts` has the correct base path:

```typescript
export default defineConfig({
  base: '/finance-tracker/', // Change to your repo name
  // ... rest of config
})
```

## Step 4: Environment Variables

This app uses localStorage for Supabase credentials, so no environment variables are needed for the client.

However, for security, you can add a `.env` file locally for development:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Important**: Never commit `.env` files to git. These are for local development only.

## Step 5: Verify Deployment

1. Visit your GitHub Pages URL
2. You should see the configuration screen
3. Enter your Supabase credentials
4. Click "Sign in with Google"
5. Create your first project

## Troubleshooting

### OAuth Redirect Not Working

- Make sure the redirect URL in Supabase matches your GitHub Pages URL exactly
- Include the trailing slash in the URL
- Make sure Google OAuth is enabled in Supabase

### Build Errors

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check that Node.js version is 18+
- Verify all dependencies are installed

### Real-time Not Working

- Make sure Realtime is enabled in Supabase
- Check that the transactions table is added to the publication
- Verify RLS policies allow realtime subscriptions

### Charts Not Displaying

- Check browser console for errors
- Verify Chart.js and react-chartjs-2 are installed
- Make sure data is being fetched correctly

## Custom Domain (Optional)

1. Go to your repository Settings → Pages
2. Under "Custom domain", add your domain
3. Configure DNS records as instructed by GitHub
4. Update the `base` path in `vite.config.ts` if needed

## Performance Optimization

### Enable Caching

GitHub Pages automatically caches static assets. The build output is already optimized for caching.

### Reduce Bundle Size

The current build shows a warning about chunk size. To optimize:

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'supabase-vendor': ['@supabase/supabase-js'],
        }
      }
    }
  }
})
```

## Security Checklist

- [ ] RLS policies enabled on all tables
- [ ] Service role keys never exposed to client
- [ ] HTTPS enabled (GitHub Pages default)
- [ ] OAuth redirect URLs properly configured
- [ ] Input validation on all forms
- [ ] No secrets committed to repository

## Maintenance

### Regular Tasks

1. **Update dependencies**: `npm update` monthly
2. **Check security advisories**: `npm audit`
3. **Backup database**: Export data regularly from Supabase
4. **Monitor logs**: Check Supabase logs for unusual activity

### Database Backups

Supabase automatically backs up your database. For additional safety:

1. Go to Database → Backups in Supabase
2. Export data periodically using the SQL Editor

## Support

For issues specific to:
- **Supabase**: Check https://supabase.com/docs
- **GitHub Pages**: Check https://docs.github.com/pages
- **Vite**: Check https://vitejs.dev/guide/
