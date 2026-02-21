# System Architecture Documentation

This document describes the system architecture of the Finance Tracker application, including component relationships, data flow, and technology stack.

## Overview

The Finance Tracker is a modern web application built with React and TypeScript, using Supabase as the backend service. The application follows a client-server architecture with real-time synchronization capabilities.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client (Frontend)"
        A[Browser] --> B[React 19 + TypeScript]
        B --> C[Next.js/Vite Router]
        C --> D[Page Components]
        D --> E[Custom Hooks]
        E --> F[Supabase Client]
        F --> G[State Management]
    end

    subgraph "Backend Services"
        H[Supabase Platform] --> I[PostgreSQL Database]
        H --> J[Realtime Service]
        H --> K[Auth Service]
        H --> L[Edge Functions]
    end

    subgraph "External Services"
        M[Google OAuth] --> K
        N[Email Service] --> L
    end

    subgraph "Data Flow"
        F --> I
        I --> J
        J --> F
        K --> F
        L --> F
    end

    A --> H
```

## Technology Stack

### Frontend
- **React 19**: Latest version with concurrent features
- **TypeScript 5.3**: Type-safe development
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **Vite 5.1**: Fast build tool and development server
- **React Router v7**: Declarative routing
- **Chart.js 4.5**: Data visualization

### Backend
- **Supabase 1.128**: Backend-as-a-Service
- **PostgreSQL 15.4**: Database with RLS policies
- **Realtime Service**: WebSocket-based synchronization
- **Edge Functions**: Serverless functions
- **Auth Service**: JWT-based authentication

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **GitHub Actions**: CI/CD pipeline
- **GitHub Pages**: Deployment platform

## Component Architecture

### Page Components
The application uses a page-based architecture with the following components:

```mermaid
graph TD
    A[App.tsx] --> B[LoginPage]
    A --> C[DashboardPage]
    A --> D[ProjectsPage]
    A --> E[ProjectDetailPage]
    A --> F[TransactionsPage]
    A --> G[ConfigPage]

    B --> H[useAuth]
    C --> I[useAuth]
    C --> J[useDashboard]
    D --> K[useProjects]
    E --> L[useProjectDetail]
    F --> M[useTransactions]
    G --> N[useSupabase]
```

### Custom Hooks
Custom hooks manage state and logic:

```mermaid
graph LR
    O[useAuth] --> P[Authentication State]
    Q[useSupabase] --> R[Supabase Configuration]
    S[useProjects] --> T[Project Data]
    U[useTransactions] --> V[Transaction Data]
    W[useCategories] --> X[Category Data]
    Y[useRealtime] --> Z[Real-time Updates]
```

## Database Architecture

### Schema Overview
```mermaid
erDiagram
    profiles ||--o{ project_members : "has"
    profiles ||--o{ transactions : "creates"
    profiles ||--o{ projects : "owns"
    profiles ||--o{ invitations : "sends"

    projects ||--o{ project_members : "has"
    projects ||--o{ transactions : "contains"
    projects ||--o{ categories : "has"
    projects ||--o{ invitations : "sends"

    project_members ||--o{ transactions : "can create"
    categories ||--o{ transactions : "categorizes"

    profiles {
        UUID id PK
        string email
        string name
        string avatar_url
        timestamp created_at
        timestamp updated_at
    }

    projects {
        UUID id PK
        string name
        string description
        UUID owner_id FK
        UUID template_id FK
        jsonb settings
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        UUID id PK
        UUID project_id FK
        decimal amount
        string currency
        UUID category_id FK
        string description
        date date
        string receipt_url
        UUID created_by FK
        string status
        timestamp created_at
        timestamp updated_at
    }

    categories {
        UUID id PK
        UUID project_id FK
        string name
        string color
        UUID parent_id FK
        timestamp created_at
    }

    project_members {
        UUID id PK
        UUID project_id FK
        UUID user_id FK
        string role
        timestamp joined_at
    }

    invitations {
        UUID id PK
        UUID project_id FK
        string email
        string role
        UUID invited_by FK
        string token
        timestamp expires_at
        boolean accepted
        timestamp created_at
    }
```

### Row-Level Security (RLS)
The database implements comprehensive RLS policies:

```mermaid
graph TB
    subgraph "RLS Policies"
        A[Users can view own profile] --> B[profiles table]
        C[Members can view projects] --> D[projects table]
        E[Owners can update projects] --> D
        F[Members can view transactions] --> G[transactions table]
        H[Members can insert transactions] --> G
        I[Owners can manage members] --> J[project_members table]
    end

    K[Authentication Context] --> A
    K --> C
    K --> E
    K --> F
    K --> H
    K --> I
```

## Authentication Flow

### OAuth Authentication
```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant S as Supabase
    participant G as Google

    U->>A: Click "Sign in with Google"
    A->>S: signInWithOAuth(provider: 'google')
    S->>G: Redirect to Google
    G->>U: Authenticate with Google
    U->>G: Grant permission
    G->>S: Return OAuth token
    S->>A: Return session
    A->>U: Update UI, redirect to dashboard
```

### Session Management
```mermaid
stateDiagram-v2
    [*] --> NotAuthenticated
    NotAuthenticated --> Configured: Enter Supabase config
    Configured --> Authenticating: Start OAuth flow
    Authenticating --> Authenticated: Success
    Authenticating --> NotAuthenticated: Cancel/Failed
    Authenticated --> SessionExpired: Token expired
    SessionExpired --> NotAuthenticated: Clear session
    Authenticated --> NotAuthenticated: Sign out
```

## Real-time Features

### Real-time Synchronization
```mermaid
graph TB
    subgraph "Client 1"
        A[User adds transaction]
        B[Optimistic UI update]
        C[Broadcast change]
    end

    subgraph "Supabase Realtime"
        D[Receive WebSocket message]
        E[Broadcast to all clients]
    end

    subgraph "Client 2"
        F[Receive update]
        G[Update UI]
    end

    A --> C
    C --> D
    D --> E
    E --> F
    F --> G
```

### Real-time Channels
```mermaid
sequenceDiagram
    participant C1 as Client 1
    participant S as Supabase
    participant C2 as Client 2

    Note over C1,C2: Both clients connected to same project

    C1->>S: Subscribe to project:123:transactions
    C2->>S: Subscribe to project:123:transactions
    S->>C1: Subscription confirmed
    S->>C2: Subscription confirmed

    Note over S: PostgreSQL trigger fires on transaction change
    S->>C1: postgres_changes event
    S->>C2: postgres_changes event
```

## Performance Architecture

### Caching Strategy
```mermaid
graph LR
    A[Browser Cache] --> B[Static Assets]
    C[React State] --> D[Component State]
    E[localStorage] --> F[User Preferences]
    G[Supabase] --> H[Database Cache]
```

### Code Splitting
```mermaid
graph TB
    A[Main Bundle] --> B[React Router]
    B --> C[Dashboard Component]
    B --> D[Projects Component]
    B --> E[Transactions Component]
    F[Chart.js Bundle] --> G[Chart Components]
    H[Supabase Bundle] --> I[API Layer]
```

## Security Architecture

### Data Flow Security
```mermaid
graph TB
    subgraph "Client"
        A[User Input]
        B[Validation]
        C[Encryption]
    end

    subgraph "Network"
        D[HTTPS]
        E[Token Authentication]
    end

    subgraph "Server"
        F[Input Sanitization]
        G[RLS Policies]
        H[Rate Limiting]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
```

### Security Layers
1. **Client-side validation**: Input validation and sanitization
2. **Network security**: HTTPS, JWT tokens
3. **Database security**: RLS policies, encryption at rest
4. **Application security**: Rate limiting, CORS policies

## Deployment Architecture

### GitHub Pages Deployment
```mermaid
graph LR
    A[Source Code] --> B[GitHub Actions]
    B --> C[Build Process]
    C --> D[Vite Build]
    D --> E[Static Assets]
    E --> F[GitHub Pages]
    F --> G[CDN Distribution]
```

### Continuous Integration
```mermaid
graph TB
    subgraph "CI/CD Pipeline"
        A[Push to main]
        B[GitHub Actions Trigger]
        C[Install Dependencies]
        D[Type Checking]
        E[Linting]
        F[Building]
        G[Testing]
        H[Deployment]
    end

    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
```

## Monitoring and Analytics

### Application Monitoring
```mermaid
graph LR
    A[Application Performance] --> B[Page Load Times]
    A --> C[Error Rates]
    A --> D[User Interactions]
    E[Database Performance] --> F[Query Times]
    E --> G[Connection Usage]
    H[Security] --> I[Authentication Attempts]
    H --> J[Audit Logs]
```

## Future Architecture Considerations

### Planned Enhancements
1. **Server Components**: Next.js server components for better performance
2. **Offline Support**: Service worker for offline functionality
3. **Advanced Analytics**: Real-time user behavior tracking
4. **Microservices**: Extract services to separate deployments
5. **Containerization**: Docker containers for consistent deployment

### Scalability Considerations
- **Database**: Read replicas for query scaling
- **Cache**: Redis for application-level caching
- **CDN**: Global content delivery network
- **Load Balancing**: Multiple deployment regions

---

*This architecture documentation provides a comprehensive overview of the Finance Tracker system. For specific implementation details, please refer to the [Developer Guide](developer-guide.md).*