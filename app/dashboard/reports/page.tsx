import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import ReportsContent from './ReportsContent'

export default async function ReportsPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist', 'housekeeping', 'security'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'

  const { data: reports } = await supabase
    .from('reports')
    .select('*, submitted_by_profile:profiles!reports_submitted_by_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Reports" subtitle="Daily operational reports" role={role} />
      <ReportsContent reports={reports ?? []} role={role} currentUserId={user.id} />
    </DashboardShell>
  )
}
