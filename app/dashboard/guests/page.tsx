import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import GuestsContent from './GuestsContent'

export default async function GuestsPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'

  const { data: guests } = await supabase
    .from('guests')
    .select('*, reservations(id, status, check_in_date, check_out_date, checked_in_at, checked_out_at, rate_at_checkin, num_guests, rooms(room_number, category))')
    .order('created_at', { ascending: false })

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Guests" subtitle="Guest profiles and stay history" role={role} />
      <GuestsContent guests={guests ?? []} />
    </DashboardShell>
  )
}
