import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import Topbar from '@/components/layout/Topbar'
import OwnerDashboardContent from './OwnerDashboardContent'

export default async function OwnerDashboardPage() {
  const { user } = await requireRole(['owner'])
  const supabase = await createClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const today = new Date().toISOString().split('T')[0]

  const [staffRes, rolesRes, roomsRes, reservationsRes, tasksRes, reportsRes, maintenanceRes, inventoryRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, status, created_at'),
    supabase.from('user_roles').select('user_id, role'),
    supabase.from('rooms').select('id, status'),
    supabase.from('reservations').select('id, status, checked_in_at').eq('status', 'checked_in'),
    supabase.from('tasks').select('id, status').in('status', ['pending', 'in_progress']),
    supabase.from('reports').select('id, created_at').gte('created_at', today),
    supabase.from('maintenance_requests').select('id, status, priority').eq('status', 'open'),
    supabase.from('inventory_items').select('id, name, current_stock, low_stock_threshold, unit'),
  ])

  const allStaff = (staffRes.data || []).filter(s => s.id !== user.id)
  const allRoles = rolesRes.data || []
  const staffWithRoles = allStaff.map(s => ({ ...s, role: allRoles.find(r => r.user_id === s.id)?.role ?? null }))

  const rooms = roomsRes.data || []
  const reservations = reservationsRes.data || []
  const tasks = tasksRes.data || []
  const reportsToday = reportsRes.data || []
  const openMaintenance = maintenanceRes.data || []
  const inventoryItems = inventoryRes.data || []
  const lowStockItems = inventoryItems.filter(i => i.current_stock <= i.low_stock_threshold)

  const kpis = {
    totalRooms: rooms.length,
    occupiedRooms: rooms.filter(r => r.status === 'occupied').length,
    availableRooms: rooms.filter(r => r.status === 'available').length,
    cleaningRooms: rooms.filter(r => r.status === 'cleaning').length,
    maintenanceRooms: rooms.filter(r => r.status === 'maintenance').length,
    checkedInGuests: reservations.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    reportsToday: reportsToday.length,
    openMaintenance: openMaintenance.length,
    criticalMaintenance: openMaintenance.filter(m => m.priority === 'critical').length,
    activeStaff: allStaff.filter(s => s.status === 'active').length,
    lowStockCount: lowStockItems.length,
  }

  return (
    <DashboardShell role="owner" fullName={profile?.full_name ?? 'Owner'} email={profile?.email ?? ''}>
      <Topbar title="Owner Dashboard" subtitle="Kayla City ApartHotel" role="owner" />
      <OwnerDashboardContent staff={staffWithRoles} ownerName={profile?.full_name ?? 'Owner'} kpis={kpis} lowStockItems={lowStockItems} />
    </DashboardShell>
  )
}
