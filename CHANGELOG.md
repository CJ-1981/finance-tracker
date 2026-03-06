# Changelog

All notable changes to the Finance Tracker application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-03-06

### Added

- **Admin Role for Project Management** (SPEC-AUTH-002)
  - Added new 'admin' role between 'owner' and 'member' in permission hierarchy
  - Admins can manage members (invite, remove, change roles) except managing owners or other admins
  - Admins can manage categories (create, update, delete)
  - Admins can edit any transaction regardless of creator
  - Admins can view and restore soft-deleted transactions
  - Admins can create and cancel invitations
  - **NOT allowed:** Admins cannot delete projects, transfer ownership, or permanently delete transactions

- **Database Schema Updates**
  - Updated `project_members.role` CHECK constraint to include 'admin'
  - Updated RLS policies for member insert/delete/update operations
  - Updated RLS policies for category management
  - Updated RLS policies for transaction management
  - Updated RLS policies for invitation management
  - Updated `restore_transaction` function to allow admins

- **TypeScript Type Updates**
  - Updated Role type to include 'admin': `'owner' | 'admin' | 'member' | 'viewer'`
  - Updated ProjectMember interface with admin role
  - Updated database types with admin role

- **Frontend Permission Updates**
  - Updated ProjectsPage to include admin role in permission checks
  - Updated TransactionsPage to include admin role in permission checks
  - Updated TransactionModal to include admin role in permission checks
  - Updated role selection options to include 'admin'

- **Internationalization**
  - Added English translations for admin role, descriptions, and error messages
  - Added Korean translations for admin role, descriptions, and error messages

### Changed

- **Database Migration** - Created safe migration script at `database/migrations/20260306_add_admin_role.sql`
  - Migration adds 'admin' role without data loss
  - All RLS policies updated with appropriate admin permissions
  - Existing data remains valid (no data loss)

## [2.5.2] - 2026-03-05

### Changed

- **Database Schema Consolidation** - Merged soft delete functionality into main schema.sql
  - Added deleted_at and deleted_by columns to transactions table
  - Added soft delete functions (soft_delete_transaction, restore_transaction, cleanup_old_deleted_transactions, permanently_delete_transaction)
  - Updated RLS policies for soft delete workflow
  - Added indexes for deleted_at and deleted_by columns
  - Single schema.sql file now contains all necessary database setup

- **Database Directory Cleanup** - Removed 17 outdated migration and utility files
  - Removed migrations/ directory (outdated migration files)
  - Removed fix scripts (fix-rls-owners.sql, fix-all-rls.sql, fix-category-rls.sql)
  - Removed utility scripts (create-*.sql, add-*.sql, diagnose.sql, verify-setup.sql, etc.)
  - Removed dangerous operations (reset-schema.sql)
  - Simpler onboarding for new users (no migration history to navigate)

### Fixed

- **PWA Logout Popup Issue** - Fixed persistent popup window when logging out on mobile PWA
  - Root cause: `window.location.href` triggering popup in PWA context
  - Final solution: `window.location.replace(basePath)` with relative path
  - Uses `import.meta.env.BASE_URL` for GitHub Pages deployment path compatibility
  - Multiple iterations tested: href → replace() → navigate() → replace(basepath)

- **GitHub Pages Deployment Path** - Fixed 404 error after logout on GitHub Pages
  - Added BASE_URL support to respect `/finance-tracker` deployment path
  - Both ProjectsPage and ConfigPage now use correct base path for redirects
  - Prevents redirect to root domain which causes 404

- **Logout Redirect Consistency** - Ensured both logout flows go to landing page
  - ProjectsPage.logout and ConfigPage.signOut now use identical redirect pattern
  - Previous inconsistency: one went to /login, other went to landing page
  - Both now consistently redirect to landing page using base path

### Changed

- **Mobile TransactionModal Layout** - Improved responsive design for mobile devices
  - Responsive padding: `p-6` on mobile, `p-8` on desktop
  - Responsive title size: `text-xl` on mobile, `text-2xl` on desktop
  - Responsive button gap: `gap-2` on mobile, `gap-3` on desktop
  - Responsive button text: `text-xs` on mobile, `text-sm` on desktop
