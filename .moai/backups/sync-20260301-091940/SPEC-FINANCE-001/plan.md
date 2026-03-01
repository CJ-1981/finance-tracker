# Implementation Plan: SPEC-FINANCE-001

## TAG BLOCK

```
SPEC_ID: SPEC-FINANCE-001
TITLE: Financial Tracking Web Application - Core MVP
PHASE: Plan
STATUS: Planned
PRIORITY: High
DOMAIN: Finance
CREATED: 2025-02-21
TRACEABILITY: SPEC-FINANCE-001/spec.md
```

## Milestones by Priority

### Primary Goals (High Priority)

**Milestone 1: Foundation & Authentication**
- Project initialization with Vite + React + TypeScript
- Supabase client setup and configuration
- Authentication flow with Google OAuth
- Session management and state store
- Configuration screen for Supabase credentials

**Milestone 2: Core Data Models**
- Database schema setup in Supabase (all tables)
- Row-Level Security (RLS) policies implementation
- Database migration scripts
- TypeScript type definitions for all data models

**Milestone 3: Project Management**
- Project CRUD operations
- Project template system
- Category management
- Project member associations

**Milestone 4: Transaction Management**
- Transaction CRUD operations
- Real-time synchronization with Supabase Realtime
- Optimistic UI updates
- Category filtering and sorting

**Milestone 5: Dashboard & Analytics**
- Chart.js integration
- Category breakdown visualization
- Spending trend charts
- Responsive dashboard layout

**Milestone 6: Mobile-Friendly UI**
- Bottom navigation component
- Responsive layout (mobile/desktop)
- Touch-optimized forms
- Mobile breakpoint testing

### Secondary Goals (Medium Priority)

**Milestone 7: User Collaboration**
- User invitation Edge Function
- Invitation email sending
- Invitation acceptance flow
- Role-based access control enforcement

**Milestone 8: Data Export**
- CSV generation functionality
- Export by date range
- CSV format validation for accounting software
- Download trigger implementation

**Milestone 9: Testing & Quality**
- Unit tests for components (Jest + React Testing Library)
- Integration tests for Supabase operations
- E2E tests for critical user flows (Cypress)
- Lighthouse performance optimization

### Final Goals (Low Priority)

**Milestone 10: Polish & Deployment**
- Error handling and user feedback
- Loading states and skeletons
- GitHub Actions CI/CD pipeline
- GitHub Pages deployment configuration
- Production environment setup

### Optional Goals (Future Enhancements)

- Receipt image upload (S3 integration)
- Offline mode with service worker
- Dark mode theme
- Multi-currency support
- Advanced analytics and reporting

## Technical Approach

### Architecture Overview

**Frontend Architecture:**
- Component-based architecture with React 18
- TypeScript for type safety
- State management: React Context API + hooks (or Zustand if complexity grows)
- Routing: React Router 6 with protected routes
- Forms: React Hook Form + Zod validation
- UI: Tailwind CSS for styling, custom components for mobile nav

**Backend Architecture:**
- Serverless: Supabase as Backend-as-a-Service
- Database: PostgreSQL 15.4 with RLS policies
- Authentication: Supabase Auth with OAuth providers
- Real-time: Supabase Realtime (PostgreSQL logical replication)
- Serverless Functions: Supabase Edge Functions (Deno runtime)

**Deployment Architecture:**
- Frontend: GitHub Pages (static hosting)
- Backend: Supabase Cloud (managed service)
- CDN: Cloudflare (automatic with GitHub Pages)
- SSL: Let's Encrypt (automatic with GitHub Pages)

### Technology Stack Justification

**Frontend Choices:**

| Technology | Version | Rationale |
|------------|---------|-----------|
| React | 18.2.0 | Component model, large ecosystem, concurrent features |
| TypeScript | 5.3.0 | Type safety for financial data, better DX |
| Tailwind CSS | 3.4.0 | Rapid UI development, consistent design system |
| Vite | 5.1.0 | Fast build tool, HMR, optimal dev experience |
| React Router | 6.20.0 | Declarative routing, protected routes |
| Chart.js | 4.x | Simple, lightweight, good mobile performance |

**Backend Choices:**

| Technology | Version | Rationale |
|------------|---------|-----------|
| Supabase | 1.128.0 | All-in-one BaaS with PostgreSQL, Auth, Realtime |
| PostgreSQL | 15.4 | Financial-grade reliability, ACID compliance |
| RLS Policies | - | Multi-tenant data isolation at database level |
| Edge Functions | - | Serverless email sending for invitations |

### Development Methodology

**Mode:** Hybrid (TDD for new code + DDD for existing code)

Since this is a greenfield project:
- **New Features:** Apply TDD workflow (RED-GREEN-REFACTOR)
- **Tests Before Implementation:** Write tests before implementing features
- **Coverage Target:** 85% for new code

**Quality Gates (from quality.yaml):**
- LSP Quality Gates: Zero errors, zero type errors, zero lint errors required
- Test Coverage: 85% minimum for new code
- TRUST 5 Framework: Tested, Readable, Unified, Secured, Trackable

### Project Structure

```
finance-tracker/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base components (Button, Input, etc.)
│   │   ├── layout/          # Layout components (Nav, Header, etc.)
│   │   ├── forms/           # Form components with validation
│   │   ├── charts/          # Chart.js wrapper components
│   │   └── mobile/          # Mobile-specific components (BottomNav)
│   ├── pages/               # Page components (routes)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── ConfigPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── projects/
│   │   │   ├── ProjectListPage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   └── ProjectCreatePage.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionListPage.tsx
│   │   │   └── TransactionFormPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   ├── services/            # API services
│   │   ├── supabase.ts     # Supabase client initialization
│   │   ├── auth.ts         # Authentication service
│   │   ├── projects.ts     # Project operations
│   │   ├── transactions.ts # Transaction operations
│   │   └── realtime.ts     # Realtime subscription management
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useTransactions.ts
│   │   └── useRealtime.ts
│   ├── store/               # State management
│   │   ├── authContext.tsx
│   │   └── transactionStore.ts
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts   # Currency, date formatting
│   │   ├── validators.ts   # Zod schemas
│   │   └── csv.ts          # CSV generation
│   ├── types/               # TypeScript types
│   │   ├── auth.ts
│   │   ├── project.ts
│   │   └── transaction.ts
│   ├── styles/              # Global styles
│   │   └── index.css       # Tailwind imports
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── index.html
├── supabase/
│   ├── migrations/         # Database migrations
│   ├── functions/          # Edge Functions
│   │   └── send-invitation/
│   └── config.toml         # Supabase CLI config
├── tests/
│   ├── unit/               # Component tests
│   ├── integration/        # API tests
│   └── e2e/                # E2E tests
├── .moai/
│   └── specs/
│       └── SPEC-FINANCE-001/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Database Schema Design

### ERD Overview

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│  profiles   │───────│   projects   │───────│  templates  │
│             │ 1   N │              │ N   1 │             │
└─────────────┘       └──────────────┘       └─────────────┘
       │                     │
       │ 1                N  │
       │                     │
       │              ┌─────┴──────┐
       │              │project_    │
       │              │members     │
       │              └────────────┘
       │                     │
       │                  N  │ 1
       │                     │
       │              ┌─────┴──────────────────┐
       │              │                         │
       │         ┌────▼────┐              ┌────▼─────┐
       │         │transac- │              │categories│
       │         │tions   │              │          │
       │         └─────────┘              └──────────┘
       │
       │
    ┌──▼──────────┐
    │ invitations │
    │             │
    └─────────────┘
```

### Migration Strategy

**Migration 1: Base Schema**
```sql
-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  template_id UUID,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
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

-- Create invitations table
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
```

**Migration 2: Row-Level Security**
```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (simplified - see full policies in spec.md)
-- Profiles: Users can view/update own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Projects: Members can view projects they belong to
CREATE POLICY "Members can view own projects" ON public.projects
  FOR SELECT USING (
    id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );

-- Add remaining RLS policies for all tables
```

**Migration 3: Indexes for Performance**
```sql
-- Indexes for common queries
CREATE INDEX idx_transactions_project_date ON public.transactions(project_id, date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_expires_at ON public.invitations(expires_at);
```

### Data Seeding

**Default Templates:**
```sql
-- General Purpose Template
INSERT INTO public.templates (name, description, schema, is_public) VALUES
('General Purpose', 'Default categories for personal finance', '{
  "categories": [
    {"name": "Food & Dining", "color": "#EF4444"},
    {"name": "Transportation", "color": "#F59E0B"},
    {"name": "Shopping", "color": "#10B981"},
    {"name": "Entertainment", "color": "#3B82F6"},
    {"name": "Bills & Utilities", "color": "#6366F1"},
    {"name": "Healthcare", "color": "#8B5CF6"},
    {"name": "Income", "color": "#EC4899"}
  ]
}'::jsonb, true);

-- Event Planning Template
INSERT INTO public.templates (name, description, schema, is_public) VALUES
('Event Planning', 'Categories for event budgeting', '{
  "categories": [
    {"name": "Venue", "color": "#DC2626"},
    {"name": "Catering", "color": "#EA580C"},
    {"name": "Entertainment", "color": "#D97706"},
    {"name": "Decorations", "color": "#059669"},
    {"name": "Photography", "color": "#0891B2"},
    {"name": "Transportation", "color": "#4F46E5"}
  ]
}'::jsonb, true);
```

## API Design

### Supabase Client Operations

**Authentication Service:**
```typescript
// services/auth.ts
export const authService = {
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
};
```

**Projects Service:**
```typescript
// services/projects.ts
export const projectsService = {
  list: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, templates(*), project_members(*)')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  create: async (project: ProjectCreate) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    return { data, error };
  },

  update: async (id: string, updates: ProjectUpdate) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    return { error };
  }
};
```

**Transactions Service:**
```typescript
// services/transactions.ts
export const transactionsService = {
  list: async (projectId: string, filters?: TransactionFilters) => {
    let query = supabase
      .from('transactions')
      .select('*, categories(*)')
      .eq('project_id', projectId);

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters?.start_date && filters?.end_date) {
      query = query.gte('date', filters.start_date).lte('date', filters.end_date);
    }

    const { data, error } = await query.order('date', { ascending: false });
    return { data, error };
  },

  create: async (transaction: TransactionCreate) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select('*, categories(*)')
      .single();
    return { data, error };
  },

  update: async (id: string, updates: TransactionUpdate) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, categories(*)')
      .single();
    return { data, error };
  }
};
```

**Realtime Service:**
```typescript
// services/realtime.ts
export const realtimeService = {
  subscribeToTransactions: (
    projectId: string,
    callback: (payload: Transaction) => void
  ) => {
    const channel = supabase
      .channel(`project:${projectId}:transactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callback(payload.new as Transaction);
          } else if (payload.eventType === 'UPDATE') {
            callback(payload.new as Transaction);
          } else if (payload.eventType === 'DELETE') {
            callback(payload.old as Transaction);
          }
        }
      )
      .subscribe();

    return channel;
  }
};
```

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Supabase downtime | High | Low | Graceful degradation, cached data, error messaging |
| RLS policy bugs (data leaks) | Critical | Medium | Thorough testing, security review, audit logging |
| Real-time connection issues | Medium | Medium | Reconnection logic, optimistic UI, offline indicators |
| Mobile browser incompatibility | Medium | Low | Progressive enhancement, browser testing, polyfills |
| GitHub Pages deployment issues | Low | Low | Test deployment early, document process thoroughly |
| CSV format incompatibility | Medium | Low | Validate against accounting software, test imports |

### Business Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| User adoption challenges | High | Medium | User testing, onboarding flow, tutorial content |
| OAuth provider limitations | Medium | Low | Support multiple OAuth providers (GitHub, Microsoft) |
| Competing with established tools | High | High | Focus on collaboration features, ease of use, free tier |
| Compliance requirements (GDPR) | Medium | Medium | Privacy policy, data export, right to deletion |

### Operational Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Database migration failures | High | Low | Rollback procedures, testing migrations, backup strategy |
| Edge Function deployment issues | Medium | Low | Local testing, gradual rollout, monitoring |
| Performance degradation | Medium | Medium | Load testing, indexing strategy, query optimization |

## Dependencies

### External Dependencies

**Required Services:**
- Supabase Cloud account (free tier sufficient for MVP)
- Google OAuth application (configured in Supabase)
- GitHub repository (for GitHub Pages deployment)
- Email service for invitations (Resend, SendGrid, or Supabase built-in)

**Development Tools:**
- Node.js 18.18.0+
- NPM 9.8.1+
- Git
- Supabase CLI (for local development and migrations)

### Internal Dependencies

**Milestone Dependencies:**
- Milestone 2 (Core Data Models) must complete before Milestone 3 (Project Management)
- Milestone 3 (Project Management) must complete before Milestone 4 (Transaction Management)
- Milestone 1 (Foundation & Authentication) must complete before all other milestones
- Milestone 7 (User Collaboration) depends on Milestone 3 (Project Management)
- Milestone 5 (Dashboard & Analytics) depends on Milestone 4 (Transaction Management)

**Feature Dependencies:**
- Real-time sync depends on transaction CRUD operations
- CSV export depends on transaction data structure
- User invitations depend on project member associations
- Dashboard charts depend on aggregated transaction data

## Expert Consultation Recommendations

### Backend Expert Consultation (HARD Recommendation)

**Reason:** This SPEC involves:
- Complex database schema with multiple related tables
- Row-Level Security (RLS) policies for multi-tenant data isolation
- Edge Functions for user invitation flow
- Real-time subscription management
- OAuth integration and session management

**Value:** Backend expert consultation ensures:
- Secure RLS policy implementation (preventing data leaks)
- Optimized database queries and indexing strategy
- Proper Edge Function design for email delivery
- Secure session management and token handling
- Real-time subscription architecture for performance

**When to Consult:** Before implementing Milestone 2 (Core Data Models) and Milestone 7 (User Collaboration)

### Frontend Expert Consultation (HARD Recommendation)

**Reason:** This SPEC involves:
- Mobile-first responsive design with bottom navigation
- Complex state management for real-time updates
- Chart.js integration for data visualization
- Form validation with React Hook Form + Zod
- Optimistic UI patterns for real-time sync
- Touch-optimized UI components

**Value:** Frontend expert consultation ensures:
- Proper mobile-first architecture patterns
- Efficient state management for real-time updates
- Performant chart rendering and data transformation
- Optimistic UI implementation without race conditions
- Accessible mobile navigation patterns
- Responsive breakpoint strategy

**When to Consult:** Before implementing Milestone 5 (Dashboard & Analytics) and Milestone 6 (Mobile-Friendly UI)

## Success Criteria

### Milestone Completion Criteria

**Milestone 1 (Foundation & Authentication):**
- User can authenticate via Google OAuth
- Session persists across page refreshes
- Configuration screen saves and validates Supabase credentials
- Supabase client initializes correctly

**Milestone 2 (Core Data Models):**
- All tables created in Supabase PostgreSQL
- RLS policies enforced for all tables
- Migration scripts tested and reversible
- TypeScript types match database schema

**Milestone 3 (Project Management):**
- User can create, view, edit, and delete projects
- Project templates initialize with categories
- Project members can be added and removed
- Categories can be created and managed

**Milestone 4 (Transaction Management):**
- User can add, view, edit, and delete transactions
- Transactions sync in real-time across multiple clients
- Optimistic UI updates work correctly
- Transactions can be filtered and sorted

**Milestone 5 (Dashboard & Analytics):**
- Dashboard displays summary statistics
- Charts render correctly with transaction data
- Charts are responsive on mobile devices
- Dashboard updates in real-time

**Milestone 6 (Mobile-Friendly UI):**
- Bottom navigation appears on mobile (<768px)
- Side navigation appears on desktop (≥768px)
- All forms are touch-friendly (44x44px tap targets)
- No horizontal scrolling on mobile devices

**Milestone 7 (User Collaboration):**
- Project owners can invite users via email
- Invitation emails are sent successfully
- Invitation acceptance adds user to project
- Role-based access control is enforced

**Milestone 8 (Data Export):**
- CSV export generates correctly formatted file
- Export can be filtered by date range
- CSV imports correctly into QuickBooks/Xero
- Download is triggered automatically

**Milestone 9 (Testing & Quality):**
- Unit test coverage ≥85%
- All E2E tests pass
- Lighthouse performance score >90
- Zero TypeScript errors
- Zero ESLint warnings

**Milestone 10 (Polish & Deployment):**
- Application deployed to GitHub Pages
- CI/CD pipeline runs successfully
- Error handling provides user-friendly messages
- Loading states prevent UI jank

## Next Steps

### Immediate Actions

1. **Review and Approve SPEC:**
   - Stakeholder review of `spec.md`
   - Acceptance criteria validation
   - Technical approach approval

2. **Expert Consultation (Recommended):**
   - Consult with expert-backend for database schema and RLS policies
   - Consult with expert-frontend for mobile-first architecture
   - Incorporate expert feedback into implementation plan

3. **Environment Setup:**
   - Create Supabase project
   - Configure Google OAuth provider
   - Set up local development environment
   - Initialize Git repository

4. **Begin Implementation:**
   - Run `/moai:2-run SPEC-FINANCE-001` to start DDD implementation
   - Follow milestone sequence
   - Implement test-first approach (TDD)

### After Implementation

1. **Testing & Validation:**
   - Run all tests (unit, integration, E2E)
   - Validate acceptance criteria
   - Performance testing (Lighthouse)

2. **Documentation:**
   - Run `/moai:3-sync SPEC-FINANCE-001` for documentation generation
   - Create user documentation
   - Create developer documentation

3. **Deployment:**
   - Deploy to GitHub Pages
   - Configure production environment variables
   - Set up monitoring and error tracking

---

**Document Status:** Ready for Implementation
**Last Updated:** 2025-02-21
**Next Review:** Post-implementation
