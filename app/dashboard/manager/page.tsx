import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'

export default async function ManagerDashboardPage() {
  const { user } = await requireRole(['owner', 'manager'])
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = roleData?.role ?? 'manager'

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? 'Manager'} email={profile?.email ?? ''}>
      <Topbar title="Manager Dashboard" subtitle="Daily operations overview" role={role} />
      <div className="dashboard-page" style={{ padding: '32px' }}>
        <div style={{
          background: '#1a160c',
          border: '1px solid #2e2010',
          borderRadius: '12px',
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, #60a5fa, transparent)',
            borderRadius: '2px',
            marginBottom: '32px',
          }} />
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '28px',
            fontWeight: 600,
            color: '#f0d3a8',
            marginBottom: '12px',
          }}>
            Manager Dashboard
          </h2>
          <p style={{ fontSize: '14px', color: '#7a6650', lineHeight: 1.6 }}>
            Rooms, reservations, and reports modules are coming in Phase 2.<br />
            Phase 1 establishes the foundation you're standing on right now.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
