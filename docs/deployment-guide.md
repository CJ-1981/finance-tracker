# Deployment Guide

This comprehensive deployment guide covers setting up the Finance Tracker application in production, including configuration, deployment options, and maintenance procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Supabase Configuration](#supabase-configuration)
4. [GitHub Pages Deployment](#github-pages-deployment)
5. [Alternative Deployment Methods](#alternative-deployment-methods)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Setup](#post-deployment-setup)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Security Considerations](#security-considerations)

## Prerequisites

Before deploying the Finance Tracker application, ensure you have:

### Required Components

- **GitHub Account**: For repository hosting
- **Supabase Project**: For backend services
- **Domain Name** (Optional): Custom domain for production
- **SSL Certificate** (Optional): HTTPS encryption
- **CI/CD Pipeline**: Automated deployment workflows

### System Requirements

- **Node.js**: Version 18.18.0 or higher
- **npm**: Version 9.8.1 or higher
- **Git**: Version 2.30 or higher
- **Vite**: Version 7.3.1 or higher

### Project Requirements

- Complete source code repository
- Supabase project with Google OAuth enabled
- Database schema deployed to Supabase
- GitHub repository configured with proper branches

## Deployment Options

### Option 1: GitHub Pages (Recommended for Static Sites)

**Best for**: Simple, free deployment
**Pros**: Free, easy setup, automatic HTTPS
**Cons**: Limited customization, static files only

### Option 2: Netlify

**Best for**: Advanced static site hosting
**Pros**: Global CDN, continuous deployment, form handling
**Cons**: Pricing based on traffic, may require paid plan

### Option 3: Vercel

**Best for**: Modern web applications
**Pros**: Fast deployments, optimized performance, built-in analytics
**Cons**: Can be complex for beginners

### Option 4: Custom Server

**Best for**: Full control over deployment
**Pros**: Complete customization, full control
**Cons**: More complex, requires server management

## Supabase Configuration

### Create Supabase Project

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
   - Sign in or create an account
   - Click "New Project"
   - Enter project details:
     - Project name: finance-tracker-prod
     - Database password: Choose a strong password
     - Region: Select closest to your users

2. **Enable Google OAuth**
   ```
   Navigate to Authentication → Providers
   - Enable Google provider
   - Add authorized redirect URLs:
     - Production: https://yourusername.github.io/finance-tracker/
     - Local development: http://localhost:3000/
   ```

3. **Configure URL Settings**
   ```
   Authentication → URL Configuration
   - Site URL: Your production URL
   - Redirect URLs: Add all authorized URLs
   ```

### Deploy Database Schema

1. **Access SQL Editor**
   ```
   Go to Database → SQL Editor in Supabase dashboard
   ```

2. **Run Schema Scripts**
   ```
   Copy the contents of database/schema.sql and execute it in the SQL editor
   ```

3. **Enable Realtime**
   ```
   Go to Realtime → Tables
   - Enable realtime for transactions table
   - Ensure RLS policies allow subscriptions
   ```

4. **Verify Configuration**
   ```
   - Tables should be created with proper RLS policies
   - Realtime should be enabled for transactions
   - OAuth should be configured and working
   ```

## GitHub Pages Deployment

### Repository Setup

1. **Create GitHub Repository**
   ```
   - Go to GitHub → New Repository
   - Enter repository name: finance-tracker
   - Make it public (or private if you have GitHub Pro)
   - Add README.md and .gitignore
   - Initialize with README
   ```

2. **Push Code to GitHub**
   ```bash
   git remote add origin https://github.com/CJ-1981/finance-tracker.git
   git branch -M main
   git push -u origin main
   ```

3. **Configure GitHub Pages**
   ```
   - Go to Repository → Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: / (root)
   - Click Save
   ```

### Vite Configuration

Update `vite.config.ts` for GitHub Pages:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/finance-tracker/', // Match your repo name
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

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
  build:
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

  # Optional: Add deployment job
  deploy-preview:
    if: github.event_name == 'pull_request'
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

      - name: Deploy Preview
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          destination_dir: preview
```

### Package.json Scripts

Update `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist",
    "predeploy": "npm run build",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src/**/*.{ts,tsx}",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Environment Variables

Create `.env.production`:

```env
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-supabase-anon-key
VITE_APP_VERSION=1.0.0
```

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Configure Environment Variables
  run: |
    echo "VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}" >> $GITHUB_ENV
    echo "VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}" >> $GITHUB_ENV
```

## Alternative Deployment Methods

### Netlify Deployment

1. **Connect Repository**
   ```
   - Go to Netlify → New site from Git
   - Select GitHub repository
   - Configure build settings
   ```

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```
   ```
   Environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   ```

3. **Configure Redirects**
   ```
   Create netlify.toml:
   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```

### Vercel Deployment

1. **Import Repository**
   ```
   - Go to Vercel → Import Project
   - Select GitHub repository
   - Configure environment variables
   ```

2. **Build Settings**
   ```
   Build Command: npm run build
   Output Directory: dist
   Framework: Static HTML
   ```

3. **Environment Variables**
   ```
   Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   server {
     listen 80;
     server_name localhost;
     root /usr/share/nginx/html;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

3. **Build and Run**
   ```bash
   docker build -t finance-tracker .
   docker run -p 3000:80 finance-tracker
   ```

## Environment Configuration

### Production Configuration

#### Production Environment Variables

```env
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

#### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  base: '/finance-tracker/', // GitHub Pages path
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemap in production
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

### Development Configuration

#### Development Environment Variables

```env
# .env.development
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=dev-anon-key
NODE_ENV=development
```

## Post-Deployment Setup

### Verification Steps

1. **Check Application URL**
   ```
   Visit your deployed application URL
   Verify all pages load correctly
   Test responsive design on mobile devices
   ```

2. **Test Authentication**
   ```
   - Click "Sign in with Google"
   - Verify OAuth flow works
   - Check if user data is loaded correctly
   ```

3. **Test Core Features**
   ```
   - Create a new project
   - Add transactions
   - View charts and analytics
   - Export CSV data
   - Test real-time updates
   ```

4. **Test Performance**
   ```
   - Load time should be under 3 seconds
   - Lighthouse score should be above 90
   - All functionality should work without JavaScript errors
   ```

### Domain Configuration (Optional)

#### Custom Domain Setup

1. **GitHub Pages Custom Domain**
   ```
   - Go to Repository → Settings → Pages
   - Under "Custom domain", enter your domain
   - Configure DNS records as instructed
   ```

2. **SSL Certificate**
   ```
   GitHub Pages provides automatic HTTPS
   No additional SSL configuration needed
   ```

#### DNS Configuration

```dns
# Example DNS records for custom domain
@ IN CNAME yourusername.github.io.
www IN CNAME yourusername.github.io.
```

### Google OAuth Configuration

1. **Update Supabase Redirect URLs**
   ```
   - Go to Supabase → Authentication → URL Configuration
   - Add your production URL to redirect URLs
   - Example: https://yourdomain.com/
   ```

2. **Update GitHub Pages Settings**
   ```
   - Go to Repository → Settings → Pages
   - Ensure custom domain is properly configured
   - Wait for DNS propagation
   ```

## Monitoring and Maintenance

### Application Monitoring

#### Performance Monitoring

```typescript
// src/utils/analytics.ts
export const trackPerformance = () => {
  if ('performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const metrics = {
        dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcpConnection: perfData.connectEnd - perfData.connectStart,
        serverResponse: perfData.responseEnd - perfData.responseStart,
        domLoad: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        fullLoad: perfData.loadEventEnd - perfData.loadEventStart
      };

      // Send to analytics service
      console.log('Performance metrics:', metrics);
    });
  }
};
```

#### Error Tracking

```typescript
// src/utils/error-tracking.ts
export const trackError = (error: Error, context?: any) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };

  // Send to error tracking service
  console.error('Application error:', errorData);
};

// Global error handler
window.addEventListener('error', (event) => {
  trackError(event.error, { type: 'global' });
});

window.addEventListener('unhandledrejection', (event) => {
  trackError(new Error(event.reason), { type: 'promise' });
});
```

### Database Monitoring

#### Supabase Dashboard

Monitor these metrics regularly:
- **Database Performance**: Query times and connection usage
- **Auth Usage**: Sign-in attempts and user growth
- **Realtime Usage**: Connection count and bandwidth
- **Storage Usage**: File storage for receipts

#### Health Checks

```typescript
// src/utils/health-check.ts
export const performHealthCheck = async () => {
  try {
    // Check Supabase connection
    const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });

    return {
      status: error ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      error: error?.message
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
};
```

### Maintenance Tasks

#### Regular Maintenance

1. **Weekly Tasks**
   ```
   - Update dependencies
   - Check error logs
   - Monitor performance metrics
   - Review user feedback
   ```

2. **Monthly Tasks**
   ```
   - Export database backups
   - Update security patches
   - Review SSL certificates
   - Audit user permissions
   ```

3. **Quarterly Tasks**
   ```
   - Major version updates
   - Database optimization
   - Feature reviews
   - Security audits
   ```

#### Database Backup

```bash
# Export database schema
supabase db dump database/schema.sql

# Export user data
supabase db dump --data-only public.profiles

# Schedule regular backups
# Use cron job or Supabase scheduled functions
```

## Troubleshooting

### Common Issues

#### Build Errors

**Issue**: Module not found
```bash
Solution: Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: TypeScript errors
```bash
Solution: Update TypeScript and dependencies
npm update typescript @types/node
```

#### Deployment Issues

**Issue**: GitHub Pages build fails
```yaml
# Check GitHub Actions logs
# Common fixes:
# - Update Node.js version in workflow
# - Ensure build directory exists
# - Check environment variables
```

**Issue**: 404 errors on deployed site
```
Solution: Update vite.config.ts base path
base: '/your-repo-name/'
```

#### Authentication Issues

**Issue**: OAuth redirect fails
```
Solution: Update Supabase redirect URLs
- Add all production domains
- Ensure URLs include trailing slash
```

**Issue**: Session expired errors
```
Solution: Clear browser cache and localStorage
- localStorage.clear()
- Refresh page
```

#### Performance Issues

**Issue**: Slow load times
```
Solution: Optimize build
- Enable code splitting
- Compress assets
- Use CDN for static files
```

**Issue**: Chart rendering slow
```
Solution: Optimize Chart.js
- Reduce data points
- Use virtual scrolling
- Implement lazy loading
```

### Debug Tools

#### Browser Developer Tools

1. **Network Tab**
   - Check API calls and response times
   - Identify failed requests
   - Monitor load performance

2. **Console Tab**
   - Check JavaScript errors
   - Log debugging information
   - Monitor performance metrics

3. **Performance Tab**
   - Analyze load performance
   - Identify bottlenecks
   - Monitor memory usage

#### Supabase Debug Tools

1. **Database Tab**
   - Check query performance
   - Review RLS policies
   - Monitor table sizes

2. **Auth Tab**
   - Check authentication logs
   - Review OAuth settings
   - Monitor user sessions

3. **Realtime Tab**
   - Check connection status
   - Monitor subscription events
   - Review bandwidth usage

### Support Resources

#### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Vite Documentation](https://vitejs.dev)

#### Community Support
- [GitHub Issues](https://github.com/CJ-1981/finance-tracker/issues)
- [Supabase Discord](https://discord.supabase.com)
- [Stack Overflow](https://stackoverflow.com)

## Security Considerations

### OAuth Security

#### Google OAuth Best Practices

1. **Redirect URLs**
   - Only add trusted domains
   - Include both HTTP and HTTPS
   - Regularly audit redirect URLs

2. **Token Management**
   - Store tokens securely in localStorage
   - Implement token expiration handling
   - Refresh tokens automatically

#### Security Headers

```typescript
// src/utils/security.ts
export const addSecurityHeaders = () => {
  if (process.env.NODE_ENV === 'production') {
    // Add security headers
    document.addEventListener('DOMContentLoaded', () => {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'";
      document.head.appendChild(meta);
    });
  }
};
```

### Database Security

#### RLS Policy Review

```sql
-- Regular security audits
-- Check that all tables have RLS policies enabled
-- Verify that policies follow least privilege principle

-- Example audit query
SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

#### Data Encryption

```typescript
// Encrypt sensitive data before storing
export const encryptData = (data: string) => {
  // Use Web Crypto API for client-side encryption
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  return window.crypto.subtle.digest('SHA-256', dataBuffer);
};
```

### SSL/TLS Configuration

#### Certificate Management

```bash
# Let's Encrypt certificate setup (for custom domains)
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### HTTPS Enforcement

```typescript
// Redirect to HTTPS in production
export const enforceHTTPS = () => {
  if (process.env.NODE_ENV === 'production && window.location.protocol === 'http:') {
    window.location.href = window.location.href.replace('http://', 'https://');
  }
};
```

### Input Validation

#### Form Validation

```typescript
// src/utils/validation.ts
export const validateTransaction = (transaction: Transaction) => {
  const errors: string[] = [];

  if (!transaction.amount || isNaN(transaction.amount)) {
    errors.push('Amount is required and must be a valid number');
  }

  if (!transaction.date || !isValidDate(transaction.date)) {
    errors.push('Date is required and must be valid');
  }

  if (!transaction.description?.trim()) {
    errors.push('Description is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### Rate Limiting

#### API Rate Limiting

```typescript
// src/utils/rate-limit.ts
const requestQueue = new Map<string, number[]>();
const MAX_REQUESTS = 100;
const TIME_WINDOW = 60000; // 1 minute

export const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userRequests = requestQueue.get(userId) || [];

  // Remove old requests
  const recentRequests = userRequests.filter(time => now - time < TIME_WINDOW);

  if (recentRequests.length >= MAX_REQUESTS) {
    return false;
  }

  recentRequests.push(now);
  requestQueue.set(userId, recentRequests);
  return true;
};
```

---

*This deployment guide provides comprehensive information for deploying and maintaining the Finance Tracker application. For additional questions or clarification, refer to the project documentation or consult with the development team.*