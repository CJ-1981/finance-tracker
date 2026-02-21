// Supabase Database Types
// This file defines the database schema types for type-safe Supabase queries

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          template_id: string | null
          settings: {
            currency: string
            date_format: string
            notifications_enabled: boolean
          } | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          template_id?: string | null
          settings?: {
            currency: string
            date_format: string
            notifications_enabled: boolean
          } | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          template_id?: string | null
          settings?: {
            currency: string
            date_format: string
            notifications_enabled: boolean
          } | null
          created_at?: string
          updated_at?: string
        }
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'member' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: 'owner' | 'member' | 'viewer'
          joined_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: 'owner' | 'member' | 'viewer'
          joined_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          project_id: string
          amount: number
          currency: string
          category_id: string
          description: string | null
          date: string
          receipt_url: string | null
          created_by: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          amount: number
          currency: string
          category_id: string
          description?: string | null
          date: string
          receipt_url?: string | null
          created_by: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          amount?: number
          currency?: string
          category_id?: string
          description?: string | null
          date?: string
          receipt_url?: string | null
          created_by?: string
          status?: 'pending' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          project_id: string
          name: string
          color: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          color: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          color?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      invitations: {
        Row: {
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
        Insert: {
          id?: string
          project_id: string
          email: string
          role: 'member' | 'viewer'
          invited_by: string
          token: string
          expires_at: string
          accepted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          email?: string
          role?: 'member' | 'viewer'
          invited_by?: string
          token?: string
          expires_at?: string
          accepted?: boolean
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          schema: Json[]
          is_public: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          schema: Json[]
          is_public?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          schema?: Json[]
          is_public?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
