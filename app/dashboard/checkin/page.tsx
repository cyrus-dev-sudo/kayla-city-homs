import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import CheckInContent from './CheckInContent'

export default async function CheckInPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const { data: rooms } = await supabase.from('rooms').select('*').eq('status', 'available').order('room_number')
  const { data: activeReservations } = await supabase
    .from('reservations')
    .select('*, guests(*), rooms(*)')
    .eq('status', 'checked_in')
    .order('checked_in_at', { ascending: false })

  const role = roleData?.role ?? 'receptionist'

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Guest Check-In" subtitle="Register guests and manage check-ins" role={role} />
      <CheckInContent
        availableRooms={rooms ?? []}
        activeReservations={activeReservations ?? []}
        staffId={user.id}
      />
    </DashboardShell>
  )
}
