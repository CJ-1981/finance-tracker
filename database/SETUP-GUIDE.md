# Finance Tracker - Database Setup Guide

## Quick Setup (2 minutes)

### 1. Check Your Supabase Connection

First, make sure you've configured the app with your Supabase credentials:
- Supabase URL: From Settings → API
- Anon Key: From Settings → API

### 2. Run the Database Schema

**The 500 error happens because the database tables don't exist yet.**

Follow these steps:

1. **Open your Supabase project**
   - Go to https://supabase.com/dashboard
   - Click on your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the schema**
   - Open the file `database/schema.sql` from this project
   - Copy ALL the content
   - Paste into the SQL Editor

4. **Run the schema**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - You should see "Success. No rows returned"

5. **Refresh the app**
   - Go back to the app
   - Refresh the page
   - The 500 error should be gone

### What the Schema Creates

- ✅ `profiles` - User profiles
- ✅ `projects` - Your financial tracking projects
- ✅ `project_members` - Project collaborators
- ✅ `categories` - Transaction categories
- ✅ `transactions` - Your financial transactions
- ✅ `invitations` - User invitations
- ✅ `audit_logs` - Activity tracking

All tables have **Row Level Security** enabled.

### Verify the Setup

To verify the tables were created:

1. In Supabase dashboard, go to **Table Editor** (left sidebar)
2. You should see all the tables listed

### Still Getting 500 Error?

1. Check the **Supabase Logs**:
   - Go to Logs → Database in Supabase dashboard
   - Look for error messages

2. Make sure you ran the **entire** schema file:
   - It should be about 289 lines
   - It creates tables, indexes, and RLS policies

3. Try running the schema again:
   - It uses `IF NOT EXISTS` so it's safe to run multiple times

### Need Help?

If you're still stuck, check:
- Your Supabase URL is correct (should end in `.supabase.co`)
- Your anon key is correct (long JWT token)
- You ran the entire schema.sql file

---

## Alternative: Manual Table Creation

If the schema doesn't work, you can create tables manually in the Table Editor:

### profiles table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| email | TEXT | User email |
| name | TEXT | User name |
| avatar_url | TEXT | Profile picture URL |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

### projects table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Project name |
| description | TEXT | Project description |
| owner_id | UUID | References profiles.id |
| settings | JSONB | Project settings |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

### project_members table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | References projects.id |
| user_id | UUID | References profiles.id |
| role | TEXT | 'owner', 'member', or 'viewer' |
| joined_at | TIMESTAMPTZ | When user joined |

### transactions table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | References projects.id |
| amount | DECIMAL | Transaction amount |
| currency | TEXT | Currency code (USD, EUR, etc.) |
| category_id | UUID | References categories.id |
| description | TEXT | Transaction description |
| date | DATE | Transaction date |
| status | TEXT | 'pending', 'approved', or 'rejected' |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Last update |

### categories table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | References projects.id |
| name | TEXT | Category name |
| color | TEXT | Category color (hex) |
| created_at | TIMESTAMPTZ | Creation time |

---

**Note**: Running the full `schema.sql` file is recommended as it also sets up proper Row Level Security policies and indexes.
