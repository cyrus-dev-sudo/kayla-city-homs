'use client'

import { Users, BedDouble, ClipboardList, Wrench, CheckSquare, Package } from 'lucide-react'
import Link from 'next/link'

interface LowStockItem {
  id: string; name: string; current_stock: number; low_stock_threshold: number; unit: string
}

interface KPIs {
  totalRooms: number; occupiedRooms: number; availableRooms: number; cleaningRooms: number; maintenanceRooms: number
  checkedInGuests: number; pendingTasks: number; inProgressTasks: number
  reportsToday: number; openMaintenance: number; criticalMaintenance: number; lowStockCount: number
}

function KPI({ label, value, icon, accent, href }: { label: string; value: number | string; icon: React.ReactNode; accent: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', padding: '18px 20px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '60' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2010' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${accent}, transparent)` }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#7a6650', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '30px', fontWeight: 600, color: '#f0d3a8', lineHeight: 1 }}>{value}</div>
          </div>
          <div style={{ width: '36px', height: '36px', background: `${accent}15`, border: `1px solid ${accent}25`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>{icon}</div>
        </div>
      </div>
    </Link>
  )
}

export default function ManagerDashboardContent({ managerName, kpis, lowStockItems }: { managerName: string; kpis: KPIs; lowStockItems: LowStockItem[] }) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const occupancyPct = kpis.totalRooms > 0 ? Math.round((kpis.occupiedRooms / kpis.totalRooms) * 100) : 0

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '12px', color: '#7a6650', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{greeting}</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '30px', fontWeight: 600, color: '#f0d3a8' }}>
          Welcome back, {managerName.split(' ')[0]}
        </h2>
        <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Occupancy banner */}
      <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', padding: '20px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#7a6650', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hotel Occupancy</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#a8702e' }}>{occupancyPct}%</span>
        </div>
        <div style={{ height: '6px', background: '#2e2010', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${occupancyPct}%`, background: 'linear-gradient(90deg, #93602a, #a8702e)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <KPI label="Guests In" value={kpis.checkedInGuests} icon={<Users size={16} />} accent="#f87171" href="/dashboard/checkin" />
        <KPI label="Pending Tasks" value={kpis.pendingTasks} icon={<CheckSquare size={16} />} accent="#fbbf24" href="/dashboard/tasks" />
        <KPI label="Reports Today" value={kpis.reportsToday} icon={<ClipboardList size={16} />} accent="#60a5fa" href="/dashboard/reports" />
        <KPI label="Open Maintenance" value={kpis.openMaintenance} icon={<Wrench size={16} />} accent={kpis.criticalMaintenance > 0 ? '#f43f5e' : '#fbbf24'} href="/dashboard/maintenance" />
        <KPI label="Total Rooms" value={kpis.totalRooms} icon={<BedDouble size={16} />} accent="#a8702e" href="/dashboard/rooms" />
        <KPI label="Low Stock Items" value={kpis.lowStockCount} icon={<Package size={16} />} accent={kpis.lowStockCount > 0 ? '#f97316' : '#4ade80'} href="/dashboard/inventory" />
      </div>

      {kpis.criticalMaintenance > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wrench size={14} color="#f43f5e" />
          <span style={{ fontSize: '13px', color: '#f43f5e', fontWeight: 600 }}>{kpis.criticalMaintenance} critical maintenance issue{kpis.criticalMaintenance > 1 ? 's' : ''} require immediate attention</span>
          <Link href="/dashboard/maintenance" style={{ marginLeft: 'auto', fontSize: '12px', color: '#f43f5e', textDecoration: 'underline' }}>View →</Link>
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Package size={14} color="#f97316" />
          <span style={{ fontSize: '13px', color: '#f97316', fontWeight: 600 }}>
            {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low: {lowStockItems.slice(0, 4).map(i => i.name).join(', ')}{lowStockItems.length > 4 ? ` +${lowStockItems.length - 4} more` : ''}
          </span>
          <Link href="/dashboard/inventory" style={{ marginLeft: 'auto', fontSize: '12px', color: '#f97316', textDecoration: 'underline' }}>View →</Link>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
