import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import { UserRole, ROLE_CONFIG } from '@/lib/roles'

export default async function StaffDashboardPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist', 'housekeeping', 'security'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()

  const role = (roleData?.role ?? 'receptionist') as UserRole
  const roleConfig = ROLE_CONFIG[role]

  const ROLE_COLORS: Record<UserRole, string> = {
    owner: '#a8702e',
    manager: '#60a5fa',
    receptionist: '#34d399',
    housekeeping: '#a78bfa',
    security: '#f87171',
  }
  const color = ROLE_COLORS[role]

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? 'Staff'} email={profile?.email ?? ''}>
      <Topbar title={`${roleConfig.label} Dashboard`} subtitle={roleConfig.description} role={role} />
      <div style={{ padding: '32px' }}>
        <div style={{
          background: '#1a160c',
          border: '1px solid #2e2010',
          borderRadius: '12px',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            height: '2px',
            background: `linear-gradient(90deg, ${color}, transparent)`,
            borderRadius: '2px',
            marginBottom: '32px',
          }} />
          <div style={{
            width: '56px', height: '56px',
            background: `${color}15`,
            border: `1px solid ${color}25`,
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '24px',
          }}>
            {role === 'receptionist' ? '🏨' : role === 'housekeeping' ? '🧹' : '🛡️'}
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '26px', fontWeight: 600, color: '#f0d3a8', marginBottom: '8px',
          }}>
            Welcome, {profile?.full_name?.split(' ')[0] ?? 'Staff'}
          </h2>
          <p style={{ fontSize: '13px', color: '#7a6650' }}>
            Your operational modules are being built. Phase 2 coming soon.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
