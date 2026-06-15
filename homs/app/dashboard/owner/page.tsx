import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import OwnerDashboardContent from './OwnerDashboardContent'

export default async function OwnerDashboardPage() {
  const { user } = await requireRole(['owner'])
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch staff stats
  const { data: allStaff } = await supabase
    .from('profiles')
    .select('id, full_name, email, status, created_at')

  const { data: allRoles } = await supabase
    .from('user_roles')
    .select('user_id, role, assigned_by, created_at')

  const staffWithRoles = (allStaff || []).map(s => ({
    ...s,
    role: allRoles?.find(r => r.user_id === s.id)?.role ?? null,
  })).filter(s => s.id !== user.id)

  return (
    <DashboardShell role="owner" fullName={profile?.full_name ?? 'Owner'} email={profile?.email ?? ''}>
      <Topbar
        title="Owner Dashboard"
        subtitle="Kayla City ApartHotel"
        role="owner"
      />
      <OwnerDashboardContent staff={staffWithRoles} ownerName={profile?.full_name ?? 'Owner'} />
    </DashboardShell>
  )
}
