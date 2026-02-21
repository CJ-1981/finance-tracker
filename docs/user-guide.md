# User Guide

This guide helps you get started with the Finance Tracker application and use all its features effectively.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Account Setup](#account-setup)
3. [Project Management](#project-management)
4. [Transaction Management](#transaction-management)
5. [Analytics Dashboard](#analytics-dashboard)
6. [Collaboration](#collaboration)
7. [Data Export](#data-export)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- A web browser (Chrome, Firefox, Safari, or Edge)
- A Google account for authentication
- A Supabase project (contact your administrator if needed)

### First-Time Setup

1. **Visit the Application**
   ```
   Open the Finance Tracker URL in your browser
   ```

2. **Configure Supabase**
   - Click on "Settings" or "Configure Supabase"
   - Enter your Supabase project URL and anonymous key
   - Click "Save Configuration"
   - *Note: This information is provided by your system administrator*

3. **Sign In**
   - Click "Sign in with Google"
   - Select your Google account
   - You'll be redirected to the dashboard

### Navigation

The application provides two navigation modes:

**Desktop Mode (≥768px)**
- Left sidebar with navigation links
- Dashboard
- Projects
- Transactions
- Settings

**Mobile Mode (<768px)**
- Bottom navigation bar with icons:
  - 🏠 Dashboard
  - 📋 Projects
  - ➕ Add Transaction (prominent button)
  - 📊 Transactions
  - ⚙️ Settings

## Account Setup

### User Profile

Your profile is automatically created when you sign in with Google. The profile includes:
- Email address
- Display name
- Profile picture (if available from Google)

### Profile Management

Currently, profile management is handled through Google authentication. To update your information:
1. Update your Google account settings
2. Sign out and sign back into the application

## Project Management

### Creating a Project

1. Go to the **Projects** page
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Required, descriptive name for your project
   - **Description**: Optional, detailed project description
   - **Template**: Choose from pre-configured templates
4. Click "Create Project"

### Project Templates

Choose from these pre-configured templates:

**General Purpose**
- Default categories: Food, Transportation, Utilities, Entertainment, etc.
- Suitable for personal or small business tracking

**Event Planning**
- Categories: Venue, Catering, Entertainment, Decorations, Supplies
- Perfect for wedding, party, or event budgeting

**Construction**
- Categories: Materials, Labor, Permits, Equipment, Subcontractors
- Ideal for construction project cost tracking

**Consulting**
- Categories: Billable Hours, Software, Travel, Marketing, Miscellaneous
- Great for freelance consultants and service providers

### Project Settings

As a project owner, you can:
- **Update Project Name/Description**: Edit basic project information
- **Change Project Settings**:
  - **Currency**: Select your preferred currency (USD, EUR, GBP, etc.)
  - **Date Format**: Choose between YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY
  - **Notifications**: Enable/disable project notifications
- **Manage Members**: Add or remove project members
- **Delete Project**: Remove the project (with confirmation dialog)

### Viewing Project Details

On the Project Detail page, you can see:
- Project overview and description
- Total number of transactions
- Recent activity
- Quick actions (Add Transaction, Export CSV)
- Member list and roles

## Transaction Management

### Adding Transactions

1. Navigate to the **Transactions** page or click "Add Transaction"
2. Fill in the transaction details:
   - **Amount**: Enter the transaction amount (can be positive or negative)
   - **Currency**: Select the currency
   - **Date**: Choose the transaction date (defaults to today)
   - **Category**: Select from your project categories
   - **Description**: Optional detailed description
3. Click "Save Transaction"

**Tips for Adding Transactions:**
- Be consistent with amount formatting (decimals separated by .)
- Use clear, descriptive text for transactions
- Select appropriate categories for better organization
- Enter correct dates for accurate financial tracking

### Editing Transactions

1. Find the transaction in the list
2. Click the "Edit" button (pencil icon)
3. Modify any field except the ID
4. Click "Save Changes"

**Note**: Only owners and the original creator can edit transactions.

### Deleting Transactions

1. Find the transaction in the list
2. Click the "Delete" button (trash icon)
3. Confirm the deletion in the dialog box

**Warning**: This action cannot be undone. Make sure you want to permanently delete the transaction.

### Managing Categories

You can create and manage transaction categories:

#### Creating Categories
1. Go to **Projects** → **Project Detail**
2. Click "Manage Categories"
3. Click "Add Category"
4. Enter:
   - **Category Name**: Descriptive name
   - **Color**: Choose a color for visual distinction
   - **Parent Category**: Optional, for hierarchical categories
5. Click "Create"

#### Category Tips
- Use consistent naming conventions
- Choose colors that are visually distinct
- Consider creating subcategories for better organization
- Delete unused categories to keep the list clean

## Analytics Dashboard

The Dashboard provides insights into your financial data with interactive charts and summaries.

### Dashboard Components

#### Financial Overview
- **Total Spent**: Current month's total expenditures
- **Budget vs Actual**: Comparison if budget is set
- **Transaction Count**: Number of transactions this month
- **Top Categories**: Highest spending categories

#### Charts and Visualizations

**Spending by Category (Pie Chart)**
- Shows distribution of spending across categories
- Interactive tooltips show exact amounts
- Click on legend segments to filter

**Spending Trend (Line Chart)**
- Displays daily spending over the last 30 days
- Helps identify spending patterns
- Hover over points for daily totals

**Category Comparison (Bar Chart)**
- Compares spending between categories
- Useful for identifying largest expense areas

### Using the Dashboard

1. **Navigate to Dashboard**: Click the dashboard icon or go to /dashboard
2. **View Charts**: All charts update automatically when transactions are added
3. **Filter Data**: Use date range filters to focus on specific periods
4. **Export Charts**: Click the download button on any chart to save as PNG

### Understanding the Data

#### Color Coding
- **Green**: Income (positive amounts)
- **Red**: Expenses (negative amounts)
- **Blue**: Neutral transactions

#### Date Ranges
- **This Month**: Current month's data
- **Last 30 Days**: Rolling 30-day period
- **This Year**: Year-to-date information
- **Custom**: Select specific date ranges

## Collaboration

### Working with Team Members

The Finance Tracker supports multiple users per project with different permission levels:

#### Permission Levels

**Owner**
- Full project control
- Can manage all aspects of the project
- Can add/remove members
- Can delete the project
- Can edit all transactions

**Member**
- Can add and edit transactions
- Cannot modify project settings
- Cannot add/remove members
- Can view all project data

**Viewer**
- Read-only access
- Can view transactions and analytics
- Cannot make any changes
- Useful for stakeholders who need visibility

### Inviting Team Members

1. Go to **Projects** → **Project Detail**
2. Click "Invite Members"
3. Enter the email address
4. Select the permission level (Member or Viewer)
5. Click "Send Invitation"

**Note**: The invitation will be sent via email with a secure link that expires after 7 days.

### Accepting Invitations

1. Click the invitation link in your email
2. You'll be automatically added to the project
3. You'll be redirected to the project dashboard

### Managing Team Members

As a project owner, you can:
- **View Members**: See all project members and their roles
- **Change Roles**: Upgrade or downgrade member permissions
- **Remove Members**: Remove users from the project
- **View Invitations**: See pending and accepted invitations

**Note**: You cannot remove yourself from a project without transferring ownership first.

## Data Export

### Exporting Transaction Data

The Finance Tracker allows you to export project transactions as CSV files compatible with accounting software.

#### Export Options

1. **Export All Transactions**: Exports all transactions in the project
2. **Export by Date Range**: Exports transactions within a specific period
3. **Export by Category**: Exports transactions for a specific category

#### CSV Format

The CSV file includes these columns:
```
Date,Description,Category,Amount,Currency,Created By
2025-02-21,Office Supplies,Supplies,-150.00,USD,john@example.com
2025-02-20,Client Lunch,Travel,-75.50,USD,jane@example.com
```

#### Export Process

1. Navigate to the **Project Detail** page
2. Click "Export CSV"
3. Select export options:
   - Date range (if applicable)
   - Category filter (if applicable)
4. Click "Download"
5. The file will download automatically

#### Importing to Accounting Software

Most accounting software supports CSV import:
1. **QuickBooks**: Use "Import Transactions"
2. **Xero**: Use "Import Transactions"
3. **FreshBooks**: Use "Import"
4. **Excel**: Open directly or use "Import" functionality

### Best Practices for Export

1. **Regular Backups**: Export data regularly as a backup
2. **Monthly Reports**: Export at the end of each month for accounting
3. **Tax Preparation**: Export quarterly for tax filing
4. **Year-End Summary**: Export yearly for financial review

## Troubleshooting

### Common Issues

#### Authentication Problems

**Problem**: "Sign in with Google" doesn't work
**Solutions**:
- Check your internet connection
- Clear browser cache and cookies
- Try a different browser
- Ensure Google services are accessible

**Problem**: "Session expired" message
**Solutions**:
- Click "Sign in with Google" again
- Check that the Supabase configuration is correct
- Clear your browser's local storage

#### Configuration Issues

**Problem**: "Supabase not configured" message
**Solutions**:
1. Click "Settings" or "Configure Supabase"
2. Verify your Supabase URL and anonymous key
3. Click "Test Connection" to verify
4. If connection fails, contact your administrator

**Problem**: Real-time updates not working
**Solutions**:
- Refresh the page
- Check your internet connection
- Clear browser cache
- Try accessing from a different browser

#### Data Issues

**Problem**: Transactions not showing in charts
**Solutions**:
- Check that transactions have valid dates
- Verify amounts are entered correctly
- Ensure categories are assigned
- Try refreshing the dashboard

**Problem**: Missing data after deletion
**Solutions**:
- Check the "Deleted Items" (if available)
- Verify user permissions
- Check if data was accidentally deleted
- Restore from backup if available

#### Mobile Issues

**Problem**: App not working on mobile
**Solutions**:
- Check internet connection
- Try accessing with mobile browser
- Clear browser data
- Ensure the app supports your device

**Problem**: Touch interface not responsive
**Solutions**:
- Restart your browser
- Update to latest browser version
- Try in different browser
- Check for screen protectors interfering with touch

### Getting Help

#### In-App Help

- Look for help icons (ℹ️) throughout the interface
- Check tooltips on buttons and forms
- Review error messages for specific guidance

#### Contact Support

If you continue to experience issues:
1. Take a screenshot of the error
2. Note the steps that led to the error
3. Contact your administrator with:
   - Your browser and version
   - Error message details
   - Screenshots if possible
   - Steps to reproduce the issue

### Performance Tips

#### Improving App Performance

1. **Browser Maintenance**
   - Clear cache regularly
   - Update browser to latest version
   - Disable unnecessary browser extensions

2. **Data Management**
   - Archive old projects regularly
   - Clean up unnecessary categories
   - Use date filters for large datasets

3. **Connection**
   - Use stable internet connection
   - Avoid using on very slow connections
   - Consider downloading CSV for offline analysis

#### Optimizing Charts

If charts are slow to load:
- Use date range filters to reduce data
- Remove unnecessary categories from view
- Wait for all charts to load before navigating away

## Advanced Tips

### Keyboard Shortcuts

- **Ctrl/Cmd + S**: Save form (when available)
- **Escape**: Cancel form or dialog
- **Enter**: Submit form (when available)
- **Tab**: Navigate between form fields

### Data Entry Efficiency

1. **Use Templates**: Create project templates for common types
2. **Batch Entry**: Add multiple similar transactions quickly
3. **Reuse Categories**: Keep category list organized and consistent
4. **Standardize Descriptions**: Use consistent naming for similar transactions

### Reporting

1. **Monthly Reports**: Export data monthly for accounting
2. **Category Analysis**: Use category breakdowns for budgeting
3. **Trend Analysis**: Regular review of spending patterns
4. **Budget Planning**: Use historical data for future budgets

### Security Best Practices

1. **Strong Passwords**: Use Google's strong authentication
2. **Secure Browsing**: Always use HTTPS connection
3. **Regular Sign-out**: Sign out when using shared computers
4. **Keep Updated**: Keep your browser updated for security patches

---

*This user guide covers all features of the Finance Tracker application. If you have additional questions or need further assistance, please contact your administrator.*