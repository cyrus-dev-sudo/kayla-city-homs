import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import ConsumptionContent from './ConsumptionContent'

export default async function ConsumptionPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist'])
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'
  const { data: records } = await supabase.from('consumption_records').select('*, rooms(room_number), recorded_by_profile:profiles!consumption_records_recorded_by_fkey(full_name)').order('created_at', { ascending: false }).limit(50)
  const { data: rooms } = await supabase.from('rooms').select('id, room_number').eq('status', 'occupied').order('room_number')
  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Consumption" subtitle="Breakfast and drink records" role={role} />
      <ConsumptionContent records={records ?? []} rooms={rooms ?? []} currentUserId={user.id} />
    </DashboardShell>
  )
}
