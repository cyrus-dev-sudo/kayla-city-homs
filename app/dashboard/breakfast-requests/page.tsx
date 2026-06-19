import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import BreakfastRequestsContent from './BreakfastRequestsContent'

export default async function BreakfastRequestsPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'

  const { data: requests } = await supabase
    .from('breakfast_requests')
    .select('*, fulfilled_by_profile:profiles!breakfast_requests_fulfilled_by_fkey(full_name)')
    .order('requested_at', { ascending: false })
    .limit(100)

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Breakfast Requests" subtitle="Guest breakfast orders for tomorrow" role={role} />
      <BreakfastRequestsContent requests={requests ?? []} currentUserId={user.id} />
    </DashboardShell>
  )
}
