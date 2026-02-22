// Database Types
export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  template_id?: string
  settings?: {
    currency: string
    date_format: string
    notifications_enabled: boolean
    custom_fields?: Array<{
      name: string
      type: 'text' | 'number' | 'date' | 'select'
      options?: string[] // For select type
    }>
    custom_field_values?: Record<string, string[]>
    default_date_period?: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all'
  }
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member' | 'viewer'
  joined_at: string
}

export interface Category {
  id: string
  project_id: string
  name: string
  color: string
  parent_id?: string
  order: number
  created_at: string
}

export interface Transaction {
  id: string
  project_id: string
  amount: number
  currency_code: string
  category_id: string
  date: string
  receipt_url?: string
  created_by: string
  status: 'pending' | 'approved' | 'rejected'
  custom_data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Invitation {
  id: string
  project_id: string
  email: string
  role: 'member' | 'viewer'
  invited_by: string
  token: string
  expires_at: string
  accepted: boolean
  created_at: string
}

export interface Template {
  id: string
  name: string
  description?: string
  schema: Category[]
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

// App Types
export interface SupabaseConfig {
  url: string
  anonKey: string
}

export type AuthState = {
  user: User | null
  session: any | null
  loading: boolean
}

export type Role = 'owner' | 'member' | 'viewer'

export interface ProjectWithMemberInfo extends Project {
  member_count?: number
  user_role?: Role
}
