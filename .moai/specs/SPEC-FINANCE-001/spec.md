# SPEC-FINANCE-001: Financial Tracking Web Application - Core MVP

## TAG BLOCK

```
SPEC_ID: SPEC-FINANCE-001
TITLE: Financial Tracking Web Application - Core MVP
STATUS: Planned
PRIORITY: High
DOMAIN: Finance
CREATED: 2025-02-21
ASSIGNED: TBD
RELATED: None
EPIC: Core Platform Foundation
```

## Environment

### Project Context

**Project Type:** Greenfield full-stack web application
**Development Mode:** Personal (single developer)
**Deployment Target:** GitHub Pages (static hosting)
**Users:** Individuals and small teams managing collaborative finances

### Technical Environment

**Frontend Stack:**
- React 18.2.0 with TypeScript 5.3.0
- Tailwind CSS 3.4.0 for mobile-first responsive design
- Vite 5.1.0 as build tool
- React Router 6.20.0 for routing
- Chart.js for data visualization

**Backend Stack:**
- Supabase 1.128.0 (PostgreSQL 15.4, Auth, Realtime, Edge Functions)
- Row-Level Security (RLS) for multi-tenant data isolation
- RESTful API with Supabase client SDK

**Development Environment:**
- Node.js 18.18.0+
- NPM 9.8.1+
- Git for version control

### Deployment Environment

**Production:** GitHub Pages with HTTPS
**Database:** Supabase Cloud (managed PostgreSQL)
**Authentication:** Supabase Auth with Google OAuth provider
**Real-time:** Supabase Realtime (WebSocket-based)

## Assumptions

### Technical Assumptions

1. **Supabase Project Setup**: User has or will create a Supabase project separately from this application
   - Confidence: High
   - Validation: User provides Supabase URL and anon key via configuration screen
   - Risk if wrong: Application cannot authenticate or store data

2. **Google OAuth Configuration**: Supabase project has Google OAuth provider enabled
   - Confidence: Medium
   - Evidence: User explicitly requested Google OAuth
   - Validation: Configuration documentation provided
   - Risk if wrong: Authentication flow fails, users cannot sign in

3. **localStorage Reliability**: Client browser supports localStorage for credential persistence
   - Confidence: High
   - Evidence: Widely supported across modern browsers (95%+ coverage)
   - Validation: Feature detection and graceful degradation
   - Risk if wrong: Users must re-enter credentials on each session

4. **Mobile Browser Compatibility**: Target browsers support CSS Grid, Flexbox, and ES6+
   - Confidence: High
   - Evidence: Mobile browsers with 2+ year update cycle support these features
   - Validation: Progressive enhancement approach
   - Risk if wrong: Degraded experience on older browsers

### Business Assumptions

1. **User Technical Literacy**: Users are comfortable with web-based applications and OAuth login flows
   - Confidence: Medium
   - Evidence: Target audience includes freelancers and small business owners
   - Validation: User testing during development
   - Risk if wrong: Higher onboarding support burden

2. **Team Size**: Primary use case involves teams of 2-10 members collaborating on projects
   - Confidence: High
   - Evidence: Product documentation specifies "small teams"
   - Validation: Analytics during beta testing
   - Risk if wrong: Performance or UX issues with larger teams

3. **Real-time Necessity**: Real-time synchronization provides significant user value over manual refresh
   - Confidence: High
   - Evidence: Competitive analysis and user persona pain points
   - Validation: A/B testing during beta
   - Risk if wrong: Added complexity without proportional benefit

4. **CSV Export Compatibility**: Target accounting systems accept standard CSV format
   - Confidence: High
   - Evidence: Universal import format for QuickBooks, Xero, FreshBooks
   - Validation: Export testing with target systems
   - Risk if wrong: Manual data transformation required

### Integration Assumptions

1. **Supabase Service Availability**: Supabase Cloud maintains 99.9% uptime SLA
   - Confidence: High
   - Evidence: Supabase published SLA guarantees
   - Validation: Monitoring and alerting setup
   - Risk if wrong: Application downtime affecting all users

2. **GitHub Pages Static Constraints**: Application can be fully static (no server-side rendering required)
   - Confidence: High
   - Evidence: Supabase client SDK works in browser environments
   - Validation: Build configuration testing
   - Risk if wrong: May require alternative deployment strategy

## Requirements

### Ubiquitous Requirements (Always Active)

**REQ-U-001:** The system SHALL validate all user inputs on both client and server side.

**REQ-U-002:** The system SHALL handle all errors gracefully with user-friendly error messages.

**REQ-U-003:** The system SHALL maintain responsive design across mobile, tablet, and desktop viewports.

**REQ-U-004:** The system SHALL implement secure communication via TLS 1.3 for all network requests.

**REQ-U-005:** The system SHALL log all authentication and authorization attempts for audit purposes.

### Event-Driven Requirements (Trigger-Response)

**REQ-E-001 (Authentication):** WHEN a user clicks "Sign in with Google", the system SHALL initiate Supabase OAuth flow with Google provider.

**REQ-E-002 (Session Management):** WHEN authentication succeeds, the system SHALL store session tokens securely and redirect to dashboard.

**REQ-E-003 (Session Expiry):** WHEN the authentication session expires, the system SHALL automatically redirect to login screen with session expired message.

**REQ-E-004 (Project Creation):** WHEN a user submits the project creation form with valid data, the system SHALL create a new project record in database and redirect to project dashboard.

**REQ-E-005 (Project Template Selection):** WHEN a user selects a template during project creation, the system SHALL initialize project with template-defined categories and settings.

**REQ-E-006 (Transaction Entry):** WHEN a user submits a transaction form with valid data, the system SHALL create transaction record, broadcast real-time update, and update dashboard charts.

**REQ-E-007 (Transaction Update):** WHEN a user edits an existing transaction, the system SHALL update database record, broadcast real-time update, and recalculate analytics.

**REQ-E-008 (CSV Export):** WHEN a user clicks export button, the system SHALL generate CSV file with current project's transactions and trigger download.

**REQ-E-009 (User Invitation):** WHEN a project owner sends an invitation via email, the system SHALL call Supabase Edge Function to send invitation email with secure acceptance link.

**REQ-E-010 (Invitation Acceptance):** WHEN an invited user clicks acceptance link, the system SHALL add user to project members and redirect to project dashboard.

**REQ-E-011 (Real-time Sync):** WHEN any user adds/edits/deletes a transaction, the system SHALL broadcast change via Supabase Realtime to all connected clients.

**REQ-E-012 (Configuration Update):** WHEN a user updates Supabase credentials in configuration screen, the system SHALL validate credentials, save to localStorage, and reinitialize Supabase client.

### State-Driven Requirements (Conditional Behavior)

**REQ-S-001 (Authenticated State):** IF user is authenticated, THEN the system SHALL display dashboard navigation and enable transaction management features.

**REQ-S-002 (Unauthenticated State):** IF user is not authenticated, THEN the system SHALL restrict access to login page and configuration screen only.

**REQ-S-003 (Project Owner):** IF current user is project owner, THEN the system SHALL enable project settings, member management, and user invitation features.

**REQ-S-004 (Project Member):** IF current user is project member (not owner), THEN the system SHALL enable transaction entry and viewing, but restrict project modification features.

**REQ-S-005 (Project Viewer):** IF current user has viewer role, THEN the system SHALL enable read-only access to transactions and analytics, but restrict data modification.

**REQ-S-006 (Empty Configuration):** IF Supabase credentials are not configured in localStorage, THEN the system SHALL display configuration screen before allowing any other features.

**REQ-S-007 (Mobile Viewport):** IF viewport width is less than 768px, THEN the system SHALL display bottom navigation bar instead of side navigation.

**REQ-S-008 (Desktop Viewport):** IF viewport width is 768px or greater, THEN the system SHALL display side navigation bar instead of bottom navigation.

### Unwanted Requirements (Prohibited Behaviors)

**REQ-N-001:** The system SHALL NOT store Supabase service role keys or secrets in client-side code or localStorage.

**REQ-N-002:** The system SHALL NOT allow unauthenticated users to access project data or transaction records.

**REQ-N-003:** The system SHALL NOT allow project members to access projects they are not members of, bypassing RLS policies.

**REQ-N-004:** The system SHALL NOT expose sensitive user data (passwords, tokens) in browser console logs or error messages.

**REQ-N-005:** The system SHALL NOT allow transaction deletion without confirmation prompt.

**REQ-N-006:** The system SHALL NOT allow project owners to remove themselves from their own project without transferring ownership first.

### Optional Requirements (Nice-to-Have Features)

**REQ-O-001:** WHERE POSSIBLE, the system SHOULD provide dark mode theme toggle for user preference.

**REQ-O-002:** WHERE POSSIBLE, the system SHOULD support multiple currency formats for transaction amounts.

**REQ-O-003:** WHERE POSSIBLE, the system SHOULD provide offline mode with data synchronization when connection restored.

**REQ-O-004:** WHERE POSSIBLE, the system SHOULD support receipt image upload and attachment to transactions.

**REQ-O-005:** WHERE POSSIBLE, the system SHOULD provide transaction categorization suggestions using machine learning.

## Specifications

### 1. Authentication & Authorization

#### 1.1 OAuth Login Flow

**Description:** Users authenticate via Google OAuth using Supabase Auth.

**Functional Requirements:**
- Sign in button triggers Supabase `signInWithOAuth()` with Google provider
- Redirect URL configured for GitHub Pages deployment
- Session token stored securely after successful authentication
- User profile retrieved from Supabase and stored in application state

**Non-Functional Requirements:**
- OAuth flow completes within 5 seconds
- Session tokens persist across browser sessions
- Automatic session refresh via Supabase client

**Data Model:**
```typescript
interface User {
  id: string; // UUID from Supabase auth.users
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
}
```

#### 1.2 Session Management

**Description:** Manage user authentication state and session lifecycle.

**Functional Requirements:**
- Session state managed via React Context or Zustand store
- Session checked on application mount
- Automatic redirect to login on session expiry
- Manual logout functionality with session cleanup

**Non-Functional Requirements:**
- Session check completes within 500ms
- No memory leaks from session listeners

#### 1.3 Authorization & Roles

**Description:** Role-based access control for project collaboration.

**Roles:**
- **Owner:** Full project control, can manage members and settings
- **Member:** Can add/edit transactions, cannot modify project settings
- **Viewer:** Read-only access to transactions and analytics

**Implementation:**
- RLS policies in PostgreSQL enforce data access
- Client-side UI reflects user permissions
- Edge Functions validate permissions for sensitive operations

### 2. Configuration Management

#### 2.1 Supabase Configuration Screen

**Description:** Initial setup screen for Supabase credentials.

**Functional Requirements:**
- Form inputs for Supabase URL and anon key
- Validation: URL format, key format, connection test
- Credentials stored in localStorage under `supabase_config` key
- Reinitialization of Supabase client on save
- Configuration screen only accessible when unauthenticated or credentials missing

**Non-Functional Requirements:**
- Connection test completes within 3 seconds
- Clear error messages for invalid credentials
- Credentials never logged or exposed in error messages

**Data Model:**
```typescript
interface SupabaseConfig {
  url: string; // Supabase project URL
  anonKey: string; // Supabase anonymous/public key
}
```

### 3. Project Management

#### 3.1 Project CRUD Operations

**Description:** Create, read, update, and delete projects.

**Functional Requirements:**
- Create project with name, description, and optional template selection
- List all projects where user is a member
- Update project details (name, description, settings)
- Delete project (with confirmation and ownership validation)
- Project settings include currency, date format, and notification preferences

**Data Model:**
```typescript
interface Project {
  id: string; // UUID
  name: string;
  description?: string;
  owner_id: string; // UUID referencing User.id
  template_id?: string; // UUID referencing Template.id
  settings: {
    currency: string; // ISO 4217 currency code
    date_format: string; // Moment.js format string
    notifications_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
}

interface ProjectMember {
  id: string; // UUID
  project_id: string; // UUID referencing Project.id
  user_id: string; // UUID referencing User.id
  role: 'owner' | 'member' | 'viewer';
  joined_at: string;
}
```

#### 3.2 Project Templates

**Description:** Pre-defined and custom templates for project initialization.

**Template Types:**
1. **General Purpose:** Default categories (Food, Transportation, Utilities, etc.)
2. **Event Planning:** Venue, Catering, Entertainment, Decorations categories
3. **Construction:** Materials, Labor, Permits, Equipment categories
4. **Consulting:** Billable Hours, Software, Travel, Miscellaneous categories

**Functional Requirements:**
- Template selection during project creation
- Templates define initial category structure
- Categories can be customized after project creation
- Users can create custom templates from existing projects

**Data Model:**
```typescript
interface Template {
  id: string; // UUID
  name: string;
  description?: string;
  categories: Category[];
  is_public: boolean; // Shareable with other users
  created_by: string; // UUID referencing User.id
  created_at: string;
}

interface Category {
  id: string; // UUID
  name: string;
  color: string; // Hex color code
  parent_id?: string; // UUID for hierarchical categories
}
```

#### 3.3 User Invitation Flow

**Description:** Project owners invite new members via email.

**Functional Requirements:**
- Invitation form accepts email address and role selection
- Supabase Edge Function sends invitation email
- Email contains secure acceptance link with invitation token
- Clicking link adds user to project and redirects to dashboard
- Invitation tokens expire after 7 days
- Pending invitations visible in project settings

**Edge Function Specification:**
```typescript
// Edge Function: send-invitation
// Input: { projectId: string, email: string, role: string, invitedBy: string }
// Output: { success: boolean, message: string }
// Sends email via Resend or SendGrid API
```

**Data Model:**
```typescript
interface Invitation {
  id: string; // UUID
  project_id: string; // UUID referencing Project.id
  email: string;
  role: 'member' | 'viewer';
  invited_by: string; // UUID referencing User.id
  token: string; // Secure random token
  expires_at: string; // Timestamp
  accepted: boolean;
  created_at: string;
}
```

### 4. Transaction Management

#### 4.1 Transaction CRUD Operations

**Description:** Create, read, update, and delete transactions.

**Functional Requirements:**
- Create transaction with amount, date, category, description
- Edit existing transactions (permission-gated)
- Delete transactions with confirmation (permission-gated)
- Filter transactions by date range, category, user
- Sort transactions by date, amount, category
- Real-time sync across all connected clients

**Data Model:**
```typescript
interface Transaction {
  id: string; // UUID
  project_id: string; // UUID referencing Project.id
  amount: number; // Decimal with 2 precision
  currency: string; // ISO 4217 currency code
  category_id: string; // UUID referencing Category.id
  description?: string;
  date: string; // ISO 8601 date string
  receipt_url?: string; // S3 storage URL
  created_by: string; // UUID referencing User.id
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

#### 4.2 Real-time Synchronization

**Description:** Broadcast transaction changes to all connected clients.

**Functional Requirements:**
- Subscribe to Supabase Realtime channel for project transactions
- Optimistic UI updates: UI updates immediately, then syncs with server
- Revert on error: If server update fails, UI reverts to previous state
- Connection status indicator (online/offline)
- Automatic reconnection with exponential backoff

**Realtime Channel:**
```typescript
// Subscribe to project transaction changes
const channel = supabase
  .channel(`project:${projectId}:transactions`)
  .on('postgres_changes', {
    event: '*', // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'transactions',
    filter: `project_id=eq.${projectId}`
  }, (payload) => {
    // Handle change: update UI, recalculate analytics
  })
  .subscribe();
```

#### 4.3 Category Management

**Description:** Manage transaction categories within projects.

**Functional Requirements:**
- Create custom categories per project
- Assign colors to categories for visual distinction
- Hierarchical category structure (parent-child relationships)
- Category usage statistics in dashboard

### 5. Dashboard & Analytics

#### 5.1 Dashboard Overview

**Description:** Main dashboard displaying project financial summary.

**Functional Requirements:**
- Total spent this month
- Budget vs actual comparison (if budget set)
- Recent transactions list (last 10)
- Category breakdown chart (pie/donut)
- Spending trend chart (line, last 30 days)
- Quick action buttons (add transaction, export CSV)

**Non-Functional Requirements:**
- Dashboard loads within 2 seconds
- Charts render within 500ms of data fetch
- Responsive layout adapts to mobile/desktop

#### 5.2 Chart.js Integration

**Description:** Interactive data visualizations using Chart.js.

**Chart Types:**
1. **Category Breakdown:** Pie or donut chart showing spending by category
2. **Spending Trend:** Line chart showing daily spending over time
3. **Budget Comparison:** Bar chart comparing budget vs actual per category

**Functional Requirements:**
- Interactive tooltips on hover
- Responsive canvas sizing
- Export chart as image functionality
- Custom color scheme using category colors

**Data Transformation:**
```typescript
// Transform transactions for Chart.js
interface ChartData {
  labels: string[]; // Category names or dates
  datasets: [{
    label: string;
    data: number[]; // Amounts
    backgroundColor: string[]; // Category colors
  }];
}
```

### 6. Data Export

#### 6.1 CSV Export

**Description:** Export project transactions as CSV file.

**Functional Requirements:**
- Export all transactions or filtered by date range
- CSV format compatible with QuickBooks, Xero, FreshBooks
- Include headers: Date, Description, Category, Amount, Currency, Created By
- Automatic download trigger on export button click
- Filename format: `{project_name}_transactions_{YYYY-MM-DD}.csv`

**CSV Format:**
```csv
Date,Description,Category,Amount,Currency,Created By
2025-02-21,Office Supplies,Supplies,150.00,USD,john@example.com
2025-02-20,Client Lunch,Travel,75.50,USD,jane@example.com
```

**Implementation:**
- Client-side CSV generation using JavaScript
- Proper escaping of commas and quotes in descriptions
- UTF-8 encoding with BOM for Excel compatibility

### 7. Mobile-Friendly UI

#### 7.1 Responsive Design

**Description:** Mobile-first design with bottom navigation.

**Functional Requirements:**
- Bottom navigation bar on mobile (<768px viewport)
- Side navigation bar on desktop (≥768px viewport)
- Touch-friendly UI elements (minimum 44x44px tap targets)
- Swipe gestures for navigation (optional)
- Responsive charts and tables

**Navigation Items (Mobile Bottom Nav):**
1. Dashboard (home icon)
2. Transactions (list icon)
3. Add Transaction (plus icon, prominent)
4. Projects (folder icon)
5. Settings (gear icon)

**Non-Functional Requirements:**
- Lighthouse Mobile score >90
- Touch response time <100ms
- No horizontal scrolling on mobile

#### 7.2 Form Design

**Description:** Mobile-optimized forms for data entry.

**Functional Requirements:**
- Large input fields with clear labels
- Numeric keyboard for amount inputs
- Date picker optimized for mobile
- Category selection with visual color indicators
- Auto-save form data to prevent data loss

### 8. Database Schema

#### 8.1 Tables

```sql
-- Users (managed by Supabase Auth)
-- auth.users table extended with public user profile

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  template_id UUID,
  settings JSONB DEFAULT '{"currency": "USD", "date_format": "YYYY-MM-DD", "notifications_enabled": true}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Project Members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Templates
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL, -- Category structure
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8.2 Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Projects: Members can view projects they belong to
CREATE POLICY "Members can view own projects"
  ON public.projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Projects: Owners can update their projects
CREATE POLICY "Owners can update own projects"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid()
  );

-- Transactions: Members can view transactions from their projects
CREATE POLICY "Members can view project transactions"
  ON public.transactions FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Transactions: Members and owners can insert transactions
CREATE POLICY "Members can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role IN ('member', 'owner')
    )
  );

-- Transactions: Owners and creators can update transactions
CREATE POLICY "Creators can update own transactions"
  ON public.transactions FOR UPDATE
  USING (
    created_by = auth.uid() OR
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Invitations: Owners can view invitations for their projects
CREATE POLICY "Owners can view project invitations"
  ON public.invitations FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
```

### 9. API Endpoints (Supabase Client SDK)

The application uses Supabase client SDK for all database operations. No custom REST API endpoints required.

**Client-Side Operations:**
- Authentication: `supabase.auth.signInWithOAuth()`, `supabase.auth.signOut()`
- Projects: `supabase.from('projects').select()`, `.insert()`, `.update()`, `.delete()`
- Transactions: `supabase.from('transactions').select()`, `.insert()`, `.update()`, `.delete()`
- Realtime: `supabase.channel().on().subscribe()`
- Storage: `supabase.storage.from('receipts').upload()`

**Edge Functions:**
- `send-invitation`: POST endpoint for sending invitation emails
- `accept-invitation`: GET endpoint for accepting invitations

## Traceability Tags

**Feature-to-Requirement Mapping:**

- Authentication: REQ-E-001, REQ-E-002, REQ-E-003, REQ-S-001, REQ-S-002, REQ-N-002
- Configuration: REQ-E-012, REQ-S-006, REQ-N-001
- Project Management: REQ-E-004, REQ-E-005, REQ-S-003, REQ-S-004, REQ-S-005
- User Invitations: REQ-E-009, REQ-E-010, REQ-N-006
- Transaction Management: REQ-E-006, REQ-E-007, REQ-E-011, REQ-N-005
- Real-time Sync: REQ-E-011
- CSV Export: REQ-E-008
- Dashboard: REQ-U-003
- Mobile UI: REQ-S-007, REQ-S-008

**Quality Attributes:**
- Security: REQ-U-004, REQ-U-005, REQ-N-001, REQ-N-004
- Usability: REQ-U-003, REQ-U-005
- Performance: REQ-U-001, REQ-U-002
- Maintainability: REQ-U-001

## Acceptance Criteria

See `acceptance.md` for detailed Given-When-Then scenarios and test cases.

## Implementation Plan

See `plan.md` for detailed implementation milestones, technical approach, and risk assessment.
