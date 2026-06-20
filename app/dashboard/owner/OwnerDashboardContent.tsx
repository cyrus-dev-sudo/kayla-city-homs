'use client'

import { UserRole, ROLE_CONFIG } from '@/lib/roles'
import { Users, UserCheck, BedDouble, ClipboardList, Wrench, CheckSquare, UserX, DoorOpen } from 'lucide-react'
import Link from 'next/link'

interface StaffMember {
  id: string; full_name: string; email: string; status: string; created_at: string; role: UserRole | null
}

interface KPIs {
  totalRooms: number; occupiedRooms: number; availableRooms: number; cleaningRooms: number; maintenanceRooms: number
  checkedInGuests: number; pendingTasks: number; inProgressTasks: number
  reportsToday: number; openMaintenance: number; criticalMaintenance: number; activeStaff: number
}

const ROLE_COLORS: Record<string, string> = {
  owner: '#a8702e', manager: '#60a5fa', receptionist: '#34d399', housekeeping: '#a78bfa', security: '#f87171',
}

function KPI({ label, value, icon, accent, href }: { label: string; value: number | string; icon: React.ReactNode; accent: string; href?: string }) {
  const content = (
    <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', padding: '18px 20px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s', cursor: href ? 'pointer' : 'default' }}
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
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link> : content
}

export default function OwnerDashboardContent({ staff, ownerName, kpis }: { staff: StaffMember[]; ownerName: string; kpis: KPIs }) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const occupancyPct = kpis.totalRooms > 0 ? Math.round((kpis.occupiedRooms / kpis.totalRooms) * 100) : 0

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      {/* Welcome */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '12px', color: '#7a6650', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>{greeting}</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '32px', fontWeight: 600, color: '#f0d3a8' }}>
          Welcome back, {ownerName.split(' ')[0]}
        </h2>
        <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>
          {now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Occupancy Banner */}
      <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#7a6650', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hotel Occupancy</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#a8702e' }}>{occupancyPct}%</span>
          </div>
          <div style={{ height: '6px', background: '#2e2010', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${occupancyPct}%`, background: 'linear-gradient(90deg, #93602a, #a8702e)', borderRadius: '3px', transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            {[
              { label: 'Occupied', value: kpis.occupiedRooms, color: '#f87171' },
              { label: 'Available', value: kpis.availableRooms, color: '#4ade80' },
              { label: 'Cleaning', value: kpis.cleaningRooms, color: '#a78bfa' },
              { label: 'Maintenance', value: kpis.maintenanceRooms, color: '#fbbf24' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#7a6650' }}>{item.label}: <strong style={{ color: item.color }}>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <KPI label="Guests In" value={kpis.checkedInGuests} icon={<Users size={16} />} accent="#f87171" href="/dashboard/checkin" />
        <KPI label="Pending Tasks" value={kpis.pendingTasks} icon={<CheckSquare size={16} />} accent="#fbbf24" href="/dashboard/tasks" />
        <KPI label="Reports Today" value={kpis.reportsToday} icon={<ClipboardList size={16} />} accent="#60a5fa" href="/dashboard/reports" />
        <KPI label="Open Maintenance" value={kpis.openMaintenance} icon={<Wrench size={16} />} accent={kpis.criticalMaintenance > 0 ? '#f43f5e' : '#fbbf24'} href="/dashboard/maintenance" />
        <KPI label="Active Staff" value={kpis.activeStaff} icon={<UserCheck size={16} />} accent="#4ade80" href="/dashboard/users" />
        <KPI label="Total Rooms" value={kpis.totalRooms} icon={<BedDouble size={16} />} accent="#a8702e" href="/dashboard/rooms" />
      </div>

      {kpis.criticalMaintenance > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wrench size={14} color="#f43f5e" />
          <span style={{ fontSize: '13px', color: '#f43f5e', fontWeight: 600 }}>{kpis.criticalMaintenance} critical maintenance issue{kpis.criticalMaintenance > 1 ? 's' : ''} require immediate attention</span>
          <Link href="/dashboard/maintenance" style={{ marginLeft: 'auto', fontSize: '12px', color: '#f43f5e', textDecoration: 'underline' }}>View →</Link>
        </div>
      )}

      {/* Staff Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2010', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#c4ab85' }}>Staff</h3>
              <p style={{ fontSize: '11px', color: '#7a6650', marginTop: '2px' }}>{staff.length} accounts</p>
            </div>
            <Link href="/dashboard/users" style={{ padding: '6px 14px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#a8702e', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {staff.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Users size={32} color="#3a3220" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '13px', color: '#7a6650' }}>No staff yet</p>
              <Link href="/dashboard/users" style={{ display: 'inline-flex', marginTop: '12px', padding: '8px 16px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 600, fontSize: '12px', borderRadius: '6px', textDecoration: 'none' }}>Add First Staff</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#221b10' }}>
                {['Name', 'Role', 'Status', 'Joined'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', borderBottom: '1px solid #2e2010' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {staff.slice(0, 8).map(member => {
                  const roleColor = member.role ? ROLE_COLORS[member.role] : '#7a6650'
                  const roleLabel = member.role ? ROLE_CONFIG[member.role as UserRole].label : 'No Role'
                  return (
                    <tr key={member.id} style={{ borderBottom: '1px solid #2e2010' }} onMouseEnter={e => (e.currentTarget.style.background = '#221b10')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#c4ab85' }}>{member.full_name}</div>
                        <div style={{ fontSize: '11px', color: '#7a6650' }}>{member.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', background: `${roleColor}15`, border: `1px solid ${roleColor}25`, borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: roleColor }}>{roleLabel}</span></td>
                      <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: member.status === 'active' ? '#4ade80' : '#f87171' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: member.status === 'active' ? '#4ade80' : '#f87171' }} />{member.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#7a6650' }}>{new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Role Distribution */}
        <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', padding: '20px' }}>
          <div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', borderRadius: '2px', marginBottom: '20px' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#c4ab85', marginBottom: '4px' }}>Staff by Role</h3>
          <p style={{ fontSize: '11px', color: '#7a6650', marginBottom: '20px' }}>Department breakdown</p>
          {(['manager', 'receptionist', 'housekeeping', 'security'] as UserRole[]).map(role => {
            const count = staff.filter(s => s.role === role).length
            const color = ROLE_COLORS[role]
            const pct = staff.length > 0 ? (count / staff.length) * 100 : 0
            return (
              <div key={role} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#7a6650' }}>{ROLE_CONFIG[role].label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color }}>{count}</span>
                </div>
                <div style={{ height: '4px', background: '#2e2010', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}80)`, borderRadius: '2px' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
