import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import NotificationsContent from './NotificationsContent'

export default async function NotificationsPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist', 'housekeeping', 'security'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Notifications" subtitle="All your notifications" role={role} />
      <NotificationsContent notifications={notifications ?? []} />
    </DashboardShell>
  )
}
