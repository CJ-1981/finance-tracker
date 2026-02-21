# Developer Guide

This guide provides comprehensive information for developers working on the Finance Tracker application, including setup, development, testing, and deployment.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Code Architecture](#code-architecture)
5. [Authentication](#authentication)
6. [Database Schema](#database-schema)
7. [API Integration](#api-integration)
8. [State Management](#state-management)
9. [Real-time Features](#real-time-features)
10. [Testing](#testing)
11. [Build and Deploy](#build-and-deploy)
12. [Contributing Guidelines](#contributing-guidelines)

## Development Environment Setup

### Prerequisites

Before you start, ensure you have:

- **Node.js**: Version 18.18.0 or higher
- **npm**: Version 9.8.1 or higher
- **Git**: For version control
- **VS Code**: Recommended IDE with extensions
- **Chrome/Firefox**: For testing and debugging

### Installation

1. **Clone the Repository**
```bash
git clone <repository-url>
cd finance-tracker
```

2. **Install Dependencies**
```bash
npm install
```

3. **Set Up Environment Variables**
```bash
# Create .env file for development (optional)
cp .env.example .env
# Edit .env with your Supabase credentials
```

4. **Install VS Code Extensions**
```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-json
code --install-extension ms-vscode.vscode-css
code --install-extension bradlc.vscode-tailwindcss
```

### IDE Configuration

#### VS Code Settings (.vscode/settings.json)

```json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": ["typescript", "typescriptreact"],
  "tailwindCSS.emmetCompletions": true,
  "typescript.suggest.autoImports": true,
  "editor.semanticHighlighting.enabled": true
}
```

#### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### TypeScript Configuration

The project uses TypeScript 5.3.0 with strict settings:

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "useDefineForClassFields": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Project Structure

```
finance-tracker/
├── src/                          # Source code
│   ├── components/               # Reusable components
│   │   ├── ui/                  # Base UI components
│   │   └── charts/              # Chart components
│   ├── pages/                   # Page components (routes)
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── TransactionsPage.tsx
│   │   └── ConfigPage.tsx
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Third-party library configs
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── database/                    # Database schema
├── public/                      # Static assets
├── .github/                     # GitHub workflows
├── docs/                        # Documentation
└── config files
```

### Detailed Breakdown

#### src/pages/
Each page component corresponds to a route:

- **DashboardPage.tsx**: Main dashboard with charts and overview
- **LoginPage.tsx**: Authentication page
- **ProjectsPage.tsx**: List of user projects
- **ProjectDetailPage.tsx**: Individual project management
- **TransactionsPage.tsx**: Transaction list and management
- **ConfigPage.tsx**: Supabase configuration

#### src/hooks/
Custom React hooks for state management:

- **useAuth.tsx**: Authentication state management
- **useSupabase.ts**: Supabase client configuration
- **useProjects.ts**: Project data fetching and management
- **useTransactions.ts**: Transaction data operations
- **useCategories.ts**: Category management

#### src/types/
TypeScript type definitions:

- **index.ts**: General application types
- **database.ts**: Supabase database types

#### src/lib/
Library configurations:

- **supabase.ts**: Supabase client initialization
- **config.ts**: Application configuration

## Technology Stack

### Frontend

**React 19**: UI library with concurrent features
- Concurrent Rendering
- Suspense for data fetching
- Server Components (when needed)
- Strict Mode for development

**TypeScript 5.3**: Type-safe JavaScript
- Strict mode enabled
- Advanced type features
- Better inference and autocompletion

**Tailwind CSS 3.4**: Utility-first CSS framework
- Responsive design
- Customizable theme
- JIT compilation

**Vite 5.1**: Build tool and development server
- Fast HMR
- Optimized builds
- Plugin architecture

**React Router v7**: Declarative routing
- Data loading APIs
- Nested routes
- Code splitting

**Chart.js 4.5**: Data visualization
- Responsive charts
- Interactive features
- Plugin support

### Backend

**Supabase 1.128**: Firebase alternative
- PostgreSQL database
- Authentication
- Realtime subscriptions
- Edge Functions
- Storage

### Development Tools

**ESLint**: Code linting
- TypeScript support
- React rules
- Prettier integration

**Prettier**: Code formatting
- Consistent style
- Opinionated defaults
- Integration with editors

## Code Architecture

### Component Architecture

#### Page Components
Pages handle route-specific logic and data fetching:

```typescript
// src/pages/DashboardPage.tsx
export default function DashboardPage() {
  const { user } = useAuth();
  const { projects } = useProjects(user?.id);
  const { data: stats } = useDashboardStats(user?.id);

  return (
    <div className="dashboard">
      <DashboardHeader />
      <StatsOverview stats={stats} />
      <Charts data={stats} />
    </div>
  );
}
```

#### Custom Hooks
Reusable logic for state management:

```typescript
// src/hooks/useProjects.ts
export const useProjects = (userId: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchProjects(userId);
  }, [userId]);

  const fetchProjects = async (userId: string) => {
    try {
      const data = await supabase.from('projects').select(/* ... */);
      setProjects(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, error };
};
```

#### Utility Functions
Pure functions for common operations:

```typescript
// src/utils/format.ts
export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatDate = (date: string, format: string = 'YYYY-MM-DD') => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};
```

### State Management

The application uses React hooks for state management with the following pattern:

#### Local Component State
For UI state that doesn't need to be persisted:

```typescript
const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState({ name: '', description: '' });
```

#### Global State
For shared application state:

```typescript
// src/hooks/useAuth.tsx
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {}
});

export const useAuth = () => useContext(AuthContext);
```

#### Supabase State
For database operations and real-time updates:

```typescript
// src/hooks/useSupabase.ts
export const useSupabase = () => {
  const [isConfigured, setIsConfigured] = useState(false);

  const checkConfiguration = async () => {
    const config = getStoredConfig();
    if (config?.url && config?.anonKey) {
      setIsConfigured(true);
    }
  };

  return { isConfigured, loading: false };
};
```

## Authentication

### Supabase Authentication Setup

The application uses Supabase Auth with Google OAuth:

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Authentication Flow

#### Google OAuth Sign-In

```typescript
// src/hooks/useAuth.tsx
export const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });

  if (error) {
    console.error('OAuth error:', error);
    throw error;
  }
};
```

#### Session Management

```typescript
// src/hooks/useAuth.tsx
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current session
    const { data: { user } } = supabase.auth.getUser();
    setUser(user);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};
```

### Protected Routes

```typescript
// src/App.tsx
function App() {
  const { user, loading } = useAuth();
  const { isConfigured } = useSupabase();

  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to config if not configured
  if (!isConfigured) {
    return <ConfigPage />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      {/* ... other routes */}
    </Routes>
  );
}
```

## Database Schema

### Database Tables

The application uses PostgreSQL with the following tables:

#### Profiles Table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Projects Table
```sql
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  template_id UUID,
  settings JSONB DEFAULT '{"currency": "USD", "date_format": "YYYY-MM-DD", "notifications_enabled": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  category_id UUID REFERENCES public.categories(id),
  description TEXT,
  date DATE NOT NULL,
  receipt_url TEXT,
  created_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row-Level Security (RLS)

The database implements comprehensive RLS policies:

```sql
-- Users can only view their own profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only view projects they belong to
CREATE POLICY "Members can view own projects"
  ON public.projects FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM public.project_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners can update their projects
CREATE POLICY "Owners can update own projects"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid()
  );
```

## API Integration

### Supabase Client Setup

```typescript
// src/lib/supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Database Operations

#### Query Data

```typescript
// Fetch all projects for a user
const fetchProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles(name, email),
      project_members!left(user_id, role)
    `)
    .eq('project_members.user_id', userId);

  if (error) throw error;
  return data;
};
```

#### Insert Data

```typescript
// Create a new project
const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

#### Update Data

```typescript
// Update project settings
const updateProject = async (id: string, updates: Partial<Project>) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

#### Delete Data

```typescript
// Delete a project
const deleteProject = async (id: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
```

### Error Handling

```typescript
// src/utils/supabase-error.ts
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Wrapper function with error handling
export async function safeDatabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  errorMessage: string
): Promise<T> {
  const { data, error } = await operation();

  if (error) {
    throw new SupabaseError(errorMessage, error.code, error.details);
  }

  if (!data) {
    throw new SupabaseError(`${errorMessage}: No data returned`);
  }

  return data;
}
```

## Real-time Features

### Realtime Subscriptions

```typescript
// src/hooks/useRealtime.ts
export const useRealtime = (channelName: string) => {
  const [channel, setChannel] = useState<Channel | null>(null);

  useEffect(() => {
    const supabaseChannel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        // Handle real-time updates
        console.log('Real-time update:', payload);
      })
      .subscribe();

    setChannel(supabaseChannel);

    return () => {
      supabaseChannel.unsubscribe();
    };
  }, [projectId]);

  return { channel };
};
```

### Optimistic Updates

```typescript
// src/hooks/useOptimisticUpdate.ts
export const useOptimisticUpdate = <T>(
  query: string,
  transform: (data: T) => T
) => {
  const [optimisticData, setOptimisticData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const optimisticCreate = async (newData: T) => {
    // Add optimistic data
    const updated = [...optimisticData, transform(newData)];
    setOptimisticData(updated);

    try {
      const { data, error } = await supabase.from(query).insert([newData]);

      if (error) {
        // Revert on error
        setOptimisticData(prev => prev.slice(0, -1));
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { optimisticData, optimisticCreate, loading };
};
```

## Testing

### Testing Setup

```bash
# Install test dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
```

### Component Testing

```typescript
// src/pages/DashboardPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with loading state', () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    });

    render(<DashboardPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders dashboard with data', async () => {
    const mockData = [
      {
        id: '1',
        name: 'Test Project',
        transactions: [
          { id: '1', amount: 100, category: 'Food', date: '2023-01-01' }
        ]
      }
    ];

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });
});
```

### Hook Testing

```typescript
// src/hooks/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

describe('useAuth', () => {
  it('provides authentication state', () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: '1', email: 'test@example.com' } },
      error: null
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com'
    });
  });
});
```

### Integration Testing

```typescript
// tests/integration/projects.spec.ts
describe('Projects Integration', () => {
  let testProject: Project;

  beforeAll(async () => {
    // Create test project
    const { data } = await supabase
      .from('projects')
      .insert([{
        name: 'Test Project',
        description: 'For testing',
        owner_id: 'test-user-id'
      }])
      .select()
      .single();

    testProject = data;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('projects').delete().eq('id', testProject.id);
  });

  it('allows project creation and retrieval', async () => {
    // Create project
    const { data: newProject } = await supabase
      .from('projects')
      .insert([{
        name: 'Integration Test',
        owner_id: 'test-user-id'
      }])
      .select()
      .single();

    // Retrieve project
    const { data: retrieved } = await supabase
      .from('projects')
      .select('*')
      .eq('id', newProject.id)
      .single();

    expect(retrieved.name).toBe('Integration Test');
  });
});
```

## Build and Deploy

### Build Process

```bash
# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Production Build

```typescript
// vite.config.ts
export default defineConfig({
  base: '/finance-tracker/', // GitHub Pages path
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

### GitHub Pages Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
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

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Environment Variables

```env
# .env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=1.0.0
```

## Contributing Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier rules
- Use semantic commit messages
- Write tests for new features
- Document complex code

### Git Workflow

1. **Create a feature branch**
```bash
git checkout -b feature/new-feature
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat: add new transaction feature"
```

3. **Push and create PR**
```bash
git push origin feature/new-feature
```

### Pull Request Process

1. Update tests to reflect changes
2. Ensure all tests pass
3. Update documentation if needed
4. Request review from team
5. Address feedback
6. Merge after approval

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] Components are properly documented
- [ ] Tests cover new functionality
- [ ] Code follows project conventions
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

### Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Tag release
5. Deploy to production

---

*This developer guide provides comprehensive information for working on the Finance Tracker application. For additional questions or clarification, refer to the project documentation or consult with the development team.*