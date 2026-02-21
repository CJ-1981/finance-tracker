# API Documentation

This document provides comprehensive API documentation for the Finance Tracker application, detailing the database schema, Supabase integration, and API usage patterns.

## Overview

The Finance Tracker application uses Supabase as its backend, providing both RESTful API capabilities and real-time data synchronization. All database operations are handled through the Supabase JavaScript client SDK.

## Database Schema

### Core Tables

The application uses the following database tables:

#### 1. `profiles` - User Profiles
Extends Supabase Auth with additional user information.

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

**TypeScript Interface:**
```typescript
interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
```

#### 2. `projects` - Financial Projects
Main project entity for tracking financial data.

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

**TypeScript Interface:**
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  template_id?: string;
  settings: {
    currency: string;
    date_format: string;
    notifications_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
}
```

#### 3. `project_members` - Project Membership
Manages user roles within projects (owner, member, viewer).

```sql
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  user_id UUID REFERENCES public.profiles(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);
```

**TypeScript Interface:**
```typescript
interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'member' | 'viewer';
  joined_at: string;
}
```

#### 4. `categories` - Transaction Categories
Categorizes transactions for better organization.

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
interface Category {
  id: string;
  project_id: string;
  name: string;
  color: string;
  parent_id?: string;
  created_at: string;
}
```

#### 5. `transactions` - Financial Transactions
Core transaction records for tracking finances.

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

**TypeScript Interface:**
```typescript
interface Transaction {
  id: string;
  project_id: string;
  amount: number;
  currency: string;
  category_id?: string;
  description?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  receipt_url?: string;
  created_by: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}
```

#### 6. `invitations` - User Invitations
Manages project invitations via email.

```sql
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
interface Invitation {
  id: string;
  project_id: string;
  email: string;
  role: 'member' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  accepted: boolean;
  created_at: string;
}
```

#### 7. `audit_logs` - Audit Trail
Tracks all important actions for security and compliance.

```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
```

## Supabase Client Configuration

### Initialization

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key');

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
```

### Authentication

#### Google OAuth Sign-In

```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`
    }
  });

  if (error) {
    console.error('OAuth error:', error);
  }
};
```

#### Sign Out

```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error);
  }
};
```

#### Get Current User

```typescript
const getUser = () => {
  const { data: { user }, error } = supabase.auth.getUser();

  if (error) {
    console.error('Get user error:', error);
    return null;
  }

  return user;
};
```

## API Operations

### Projects API

#### List User Projects

```typescript
const fetchUserProjects = async () => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      profiles(name, email),
      project_members!left(user_id, role)
    `)
    .eq('project_members.user_id', user?.id)
    .eq('project_members.role', 'owner');

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return projects;
};
```

#### Create Project

```typescript
const createProject = async (projectData: { name: string; description?: string; templateId?: string }) => {
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: projectData.name,
      description: projectData.description,
      template_id: projectData.templateId,
      owner_id: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  // Add creator as owner
  await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: user?.id,
    role: 'owner'
  });

  return project;
};
```

#### Update Project

```typescript
const updateProject = async (projectId: string, updates: { name?: string; description?: string }) => {
  const { data: project, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('owner_id', user?.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }

  return project;
};
```

### Transactions API

#### Fetch Project Transactions

```typescript
const fetchTransactions = async (projectId: string, filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string
}) => {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      profiles(name, email),
      categories(name, color)
    `)
    .eq('project_id', projectId);

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  const { data: transactions, error } = await query.order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return transactions;
};
```

#### Create Transaction

```typescript
const createTransaction = async (projectId: string, transactionData: {
  amount: number;
  currency: string;
  category_id?: string;
  description?: string;
  date: string;
}) => {
  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      project_id: projectId,
      created_by: user?.id,
      ...transactionData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating transaction:', error);
    return null;
  }

  return transaction;
};
```

#### Update Transaction

```typescript
const updateTransaction = async (projectId: string, transactionId: string, updates: {
  amount?: number;
  currency?: string;
  category_id?: string;
  description?: string;
  date?: string;
  status?: 'pending' | 'approved' | 'rejected';
}) => {
  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId)
    .eq('project_id', projectId)
    .or('created_by.eq.' + user?.id + ',project.project_id.in.(' + projectId + ')')
    .select()
    .single();

  if (error) {
    console.error('Error updating transaction:', error);
    return null;
  }

  return transaction;
};
```

#### Delete Transaction

```typescript
const deleteTransaction = async (projectId: string, transactionId: string) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('project_id', projectId)
    .or('created_by.eq.' + user?.id + ',project.project_id.in.(' + projectId + ')');

  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }

  return true;
};
```

### Categories API

#### Fetch Project Categories

```typescript
const fetchCategories = async (projectId: string) => {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('project_id', projectId)
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories;
};
```

#### Create Category

```typescript
const createCategory = async (projectId: string, categoryData: {
  name: string;
  color?: string;
  parent_id?: string;
}) => {
  const { data: category, error } = await supabase
    .from('categories')
    .insert({
      project_id: projectId,
      ...categoryData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    return null;
  }

  return category;
};
```

### Invitations API

#### Send Invitation

```typescript
const sendInvitation = async (projectId: string, email: string, role: 'member' | 'viewer') => {
  // Note: This should use an Edge Function for security
  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      project_id: projectId,
      email,
      role,
      invited_by: user?.id,
      token: generateSecureToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invitation:', error);
    return null;
  }

  // TODO: Send email via Edge Function
  // await sendInvitationEmail(invitation);

  return invitation;
};
```

#### Accept Invitation

```typescript
const acceptInvitation = async (token: string) => {
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .eq('accepted', false)
    .single();

  if (error || !invitation) {
    console.error('Invalid or expired invitation');
    return null;
  }

  const { error: updateError } = await supabase
    .from('invitations')
    .update({ accepted: true })
    .eq('id', invitation.id);

  if (updateError) {
    console.error('Error accepting invitation:', updateError);
    return null;
  }

  // Add user to project
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: invitation.project_id,
      user_id: user?.id,
      role: invitation.role
    });

  if (memberError) {
    console.error('Error adding to project:', memberError);
    return null;
  }

  return invitation;
};
```

## Real-time Subscriptions

### Transaction Updates

```typescript
const subscribeToTransactions = (projectId: string, callback: (payload: any) => void) => {
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
      callback
    )
    .subscribe();

  return channel;
};

// Usage example
const channel = subscribeToTransactions('project-123', (payload) => {
  console.log('Transaction changed:', payload);

  if (payload.eventType === 'INSERT') {
    // Add new transaction to UI
  } else if (payload.eventType === 'UPDATE') {
    // Update existing transaction in UI
  } else if (payload.eventType === 'DELETE') {
    // Remove transaction from UI
  }
});

// Cleanup
channel.unsubscribe();
```

### Project Members Updates

```typescript
const subscribeToProjectMembers = (projectId: string, callback: (payload: any) => void) => {
  const channel = supabase
    .channel(`project:${projectId}:members`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'project_members',
        filter: `project_id=eq.${projectId}`
      },
      callback
    )
    .subscribe();

  return channel;
};
```

## Error Handling

### Common Error Patterns

#### Authentication Errors

```typescript
const handleAuthError = (error: any) => {
  switch (error.code) {
    case 'session_not_found':
      // Redirect to login
      break;
    case 'invalid_token':
      // Clear local storage and refresh
      localStorage.removeItem('supabase_config');
      window.location.reload();
      break;
    default:
      console.error('Auth error:', error);
  }
};
```

#### Permission Errors

```typescript
const handlePermissionError = (error: any) => {
  if (error.code === 'PGRST116') {
    // Row Level Security policy violation
    console.error('Access denied - insufficient permissions');
    return false;
  }
  return true;
};
```

#### Network Errors

```typescript
const handleNetworkError = (error: any) => {
  if (error.code === 'network_error') {
    // Show offline message
    showOfflineNotification();
    return false;
  }
  return true;
};
```

## Security Considerations

### Row-Level Security (RLS)

The database implements comprehensive RLS policies to ensure:

1. Users can only view projects they belong to
2. Project owners can manage their projects
3. Users can only modify their own transactions (unless they're owners)
4. Invitation management is restricted to project owners

### Data Validation

All operations include both client-side and server-side validation:

- Client validation for immediate feedback
- Server validation via RLS policies
- Type-safe operations using TypeScript interfaces

### Token Management

- Supabase tokens are stored securely in localStorage
- Tokens are refreshed automatically
- Session expiration is handled gracefully

## Performance Optimization

### Indexes

The database includes optimized indexes for:
- Project owner lookups
- Transaction date queries
- Project membership queries
- Invitation token lookups

### Caching Strategy

- Projects and user data are cached in React state
- Real-time subscriptions reduce API calls
- Optimistic updates improve perceived performance

### Query Optimization

- Select only necessary fields
- Use RLS filtering at the database level
- Batch operations when possible

## Troubleshooting

### Common Issues

#### Real-time Connection Problems

```typescript
// Check connection status
supabase.realtime.setAuth(supabase.auth.session()?.access_token);

// Reconnect
supabase.realtime.connect();
```

#### Authentication Issues

```typescript
// Check current session
const { data: { session }, error } = await supabase.auth.getSession();
if (error) {
  console.error('Session error:', error);
  supabase.auth.signOut();
}
```

#### Permission Issues

```typescript
// Debug RLS policies by checking user ID
console.log('Current user ID:', supabase.auth.session()?.user?.id);
console.log('Auth header:', supabase.auth.session()?.access_token);
```

## Next Steps

1. **Edge Functions**: Implement invitation email sending via Edge Functions
2. **Webhooks**: Add webhooks for complex notification scenarios
3. **Advanced Filtering**: Implement more sophisticated filtering and search
4. **Bulk Operations**: Add support for batch transaction imports/exports
5. **Advanced Analytics**: Integrate with data visualization libraries for deeper insights

---

*This documentation covers all API operations for the Finance Tracker application. For the most current information, refer to the source code and Supabase dashboard.*