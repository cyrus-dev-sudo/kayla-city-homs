import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import MaintenanceContent from './MaintenanceContent'

export default async function MaintenancePage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist', 'housekeeping', 'security'])
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'
  const { data: requests } = await supabase.from('maintenance_requests').select('*, rooms(room_number), reported_by_profile:profiles!maintenance_requests_reported_by_fkey(full_name)').order('created_at', { ascending: false })
  const { data: rooms } = await supabase.from('rooms').select('id, room_number').order('room_number')
  const canManage = ['owner', 'manager'].includes(role)
  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Maintenance" subtitle="Maintenance requests and repairs" role={role} />
      <MaintenanceContent requests={requests ?? []} rooms={rooms ?? []} canManage={canManage} currentUserId={user.id} />
    </DashboardShell>
  )
}
