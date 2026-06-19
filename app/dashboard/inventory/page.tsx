import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import InventoryContent from './InventoryContent'

export default async function InventoryPage() {
  const { user } = await requireRole(['owner', 'manager'])
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single()
  const role = roleData?.role ?? 'manager'

  const [itemsRes, txRes] = await Promise.all([
    supabase.from('inventory_items').select('*').order('category').order('name'),
    supabase.from('inventory_transactions').select('*, item:inventory_items(name, unit), performed_by_profile:profiles!inventory_transactions_performed_by_fkey(full_name)').order('created_at', { ascending: false }).limit(50),
  ])

  return (
    <DashboardShell role={role} fullName={profile?.full_name ?? ''} email={profile?.email ?? ''}>
      <Topbar title="Inventory" subtitle="Stock management across all categories" role={role} />
      <InventoryContent items={itemsRes.data ?? []} transactions={txRes.data ?? []} currentUserId={user.id} />
    </DashboardShell>
  )
}
