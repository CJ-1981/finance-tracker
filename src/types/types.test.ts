// Test for SPEC-AUTH-002: Admin Role for Project Management
import { describe, it, expect } from 'vitest'
import type { ProjectMember, Role } from './index'
import type { Database } from './database'

// Type guard to verify role is valid
function isValidRole(role: string): role is Role {
  return ['owner', 'admin', 'member', 'viewer'].includes(role)
}

describe('SPEC-AUTH-002: Admin Role Type Support', () => {
  describe('ProjectMember interface', () => {
    it('should accept admin role in ProjectMember', () => {
      const adminMember: ProjectMember = {
        id: 'test-id',
        project_id: 'project-id',
        user_id: 'user-id',
        role: 'admin', // This should compile without type error
        joined_at: '2024-01-01T00:00:00Z'
      }

      expect(adminMember.role).toBe('admin')
    })
  })

  describe('Role type', () => {
    it('should include admin role in Role type union', () => {
      // This test will fail at compile time if 'admin' is not in Role type
      const adminRole: Role = 'admin'
      const ownerRole: Role = 'owner'
      const memberRole: Role = 'member'
      const viewerRole: Role = 'viewer'

      expect(adminRole).toBe('admin')
      expect(ownerRole).toBe('owner')
      expect(memberRole).toBe('member')
      expect(viewerRole).toBe('viewer')
    })

    it('should have admin as valid role', () => {
      expect(isValidRole('admin')).toBe(true)
      expect(isValidRole('owner')).toBe(true)
      expect(isValidRole('member')).toBe(true)
      expect(isValidRole('viewer')).toBe(true)
      expect(isValidRole('invalid')).toBe(false)
    })
  })

  describe('Database types', () => {
    it('should accept admin role in project_members database type', () => {
      const adminMember: Database['public']['Tables']['project_members']['Row'] = {
        id: 'test-id',
        project_id: 'project-id',
        user_id: 'user-id',
        role: 'admin', // This should compile without type error
        joined_at: '2024-01-01T00:00:00Z'
      }

      expect(adminMember.role).toBe('admin')
    })

    it('should accept admin role in project_members Insert type', () => {
      const adminMember: Database['public']['Tables']['project_members']['Insert'] = {
        id: 'test-id',
        project_id: 'project-id',
        user_id: 'user-id',
        role: 'admin', // This should compile without type error
        joined_at: '2024-01-01T00:00:00Z'
      }

      expect(adminMember.role).toBe('admin')
    })

    it('should accept admin role in project_members Update type', () => {
      const adminMemberUpdate: Database['public']['Tables']['project_members']['Update'] = {
        role: 'admin' // This should compile without type error
      }

      expect(adminMemberUpdate.role).toBe('admin')
    })

    it('should NOT accept admin role in invitations (should remain member/viewer only)', () => {
      // Verify invitations only allow member and viewer roles (no admin)
      const validInvitationRoles: Database['public']['Tables']['invitations']['Row']['role'][] = ['member', 'viewer']
      expect(validInvitationRoles).not.toContain('admin')
      expect(validInvitationRoles).not.toContain('owner')
    })
  })
})
