export type UserRole = 'owner' | 'manager' | 'receptionist' | 'housekeeping' | 'security'

export type AccountStatus = 'active' | 'inactive'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  status: AccountStatus
  created_at: string
  updated_at: string
}

export interface UserRoleRecord {
  id: string
  user_id: string
  role: UserRole
  assigned_by?: string
  created_at: string
}

export interface StaffMember extends Profile {
  role: UserRole
}

// ─────────────────────────────────────────
// ROLE DISPLAY CONFIG
// ─────────────────────────────────────────
export const ROLE_CONFIG: Record<UserRole, { label: string; color: string; description: string }> = {
  owner: {
    label: 'Owner',
    color: 'amber',
    description: 'Full system access and control',
  },
  manager: {
    label: 'Manager',
    color: 'blue',
    description: 'Daily operations management',
  },
  receptionist: {
    label: 'Receptionist',
    color: 'emerald',
    description: 'Front desk and guest operations',
  },
  housekeeping: {
    label: 'Housekeeping',
    color: 'purple',
    description: 'Room cleaning and maintenance reports',
  },
  security: {
    label: 'Security',
    color: 'red',
    description: 'Security reports and incident logging',
  },
}

// ─────────────────────────────────────────
// ROUTE PERMISSIONS
// ─────────────────────────────────────────
export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  owner: '/dashboard/owner',
  manager: '/dashboard/manager',
  receptionist: '/dashboard/staff',
  housekeeping: '/dashboard/staff',
  security: '/dashboard/staff',
}

export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/owner': ['owner'],
  '/dashboard/manager': ['owner', 'manager'],
  '/dashboard/staff': ['owner', 'manager', 'receptionist', 'housekeeping', 'security'],
  '/dashboard/users': ['owner'],
}
