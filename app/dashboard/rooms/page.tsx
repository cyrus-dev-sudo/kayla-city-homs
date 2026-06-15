import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import RoomsContent from './RoomsContent'

export default async function RoomsPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist', 'housekeeping', 'security'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const { data: rooms } = await supabase.from('rooms').select('*').order('room_number')

  const role = roleData?.role ?? 'receptionist'
  const canEdit = ['owner', 'manager'].includes(role)

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Rooms" subtitle="Room status and management" role={role} />
      <RoomsContent rooms={rooms ?? []} canEdit={canEdit} />
    </DashboardShell>
  )
}
