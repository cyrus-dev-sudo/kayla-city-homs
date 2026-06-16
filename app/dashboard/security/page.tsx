import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import SecurityContent from './SecurityContent'

export default async function SecurityPage() {
  const { user } = await requireRole(['owner', 'manager', 'security'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'security'

  const [visitors, vehicles, patrols, incidents] = await Promise.all([
    supabase.from('visitor_log').select('*, recorded_by_profile:profiles!visitor_log_recorded_by_fkey(full_name)').order('created_at', { ascending: false }).limit(50),
    supabase.from('vehicle_log').select('*, recorded_by_profile:profiles!vehicle_log_recorded_by_fkey(full_name)').order('created_at', { ascending: false }).limit(50),
    supabase.from('patrol_rounds').select('*, officer:profiles!patrol_rounds_officer_id_fkey(full_name)').order('created_at', { ascending: false }).limit(20),
    supabase.from('incident_reports').select('*, reported_by_profile:profiles!incident_reports_reported_by_fkey(full_name)').order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Security" subtitle="Visitor log, vehicles, patrols & incidents" role={role} />
      <SecurityContent
        visitors={visitors.data ?? []}
        vehicles={vehicles.data ?? []}
        patrols={patrols.data ?? []}
        incidents={incidents.data ?? []}
        currentUserId={user.id}
        role={role}
      />
    </DashboardShell>
  )
}
