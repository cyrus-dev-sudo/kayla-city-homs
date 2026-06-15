import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import UserManagementContent from './UserManagementContent'

export default async function UsersPage() {
  const { user } = await requireRole(['owner'])
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: allRoles } = await supabase
    .from('user_roles')
    .select('*')

  const staff = (allProfiles || [])
    .filter(p => p.id !== user.id)
    .map(p => ({
      ...p,
      role: allRoles?.find(r => r.user_id === p.id)?.role ?? null,
    }))

  return (
    <DashboardShell role="owner" fullName={profile?.full_name ?? 'Owner'} email={profile?.email ?? ''}>
      <Topbar title="Staff Accounts" subtitle="Create and manage hotel staff" role="owner" />
      <UserManagementContent staff={staff} />
    </DashboardShell>
  )
}
