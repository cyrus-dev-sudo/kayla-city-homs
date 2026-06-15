import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import TasksContent from './TasksContent'

export default async function TasksPage() {
  const { user } = await requireRole(['owner', 'manager', 'receptionist', 'housekeeping', 'security'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'receptionist'
  const canAssign = ['owner', 'manager'].includes(role)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name), assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)')
    .order('created_at', { ascending: false })

  const { data: allStaff } = canAssign
    ? await supabase.from('profiles').select('id, full_name').neq('id', user.id)
    : { data: [] }

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Tasks" subtitle="Assignments and work orders" role={role} />
      <TasksContent tasks={tasks ?? []} staff={allStaff ?? []} canAssign={canAssign} currentUserId={user.id} />
    </DashboardShell>
  )
}
