'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole, ROLE_CONFIG } from '@/lib/roles'
import { LayoutDashboard, Users, LogOut, Building2, ChevronRight, Shield, BedDouble, UserPlus, ClipboardList, Wrench, Coffee, CheckSquare, User, Bell } from 'lucide-react'

interface SidebarProps { role: UserRole; fullName: string; email: string }

const NAV_ITEMS: Record<UserRole, { href: string; label: string; icon: React.ReactNode }[]> = {
  owner: [
    { href: '/dashboard/owner', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={15} /> },
    { href: '/dashboard/checkin', label: 'Check-In', icon: <UserPlus size={15} /> },
    { href: '/dashboard/guests', label: 'Guests', icon: <User size={15} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={15} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={15} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={15} /> },
    { href: '/dashboard/consumption', label: 'Consumption', icon: <Coffee size={15} /> },
    { href: '/dashboard/security', label: 'Security', icon: <Shield size={15} /> },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={15} /> },
    { href: '/dashboard/users', label: 'Staff Accounts', icon: <Users size={15} /> },
  ],
  manager: [
    { href: '/dashboard/manager', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={15} /> },
    { href: '/dashboard/checkin', label: 'Check-In', icon: <UserPlus size={15} /> },
    { href: '/dashboard/guests', label: 'Guests', icon: <User size={15} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={15} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={15} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={15} /> },
    { href: '/dashboard/consumption', label: 'Consumption', icon: <Coffee size={15} /> },
    { href: '/dashboard/security', label: 'Security', icon: <Shield size={15} /> },
  ],
  receptionist: [
    { href: '/dashboard/staff', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={15} /> },
    { href: '/dashboard/checkin', label: 'Check-In', icon: <UserPlus size={15} /> },
    { href: '/dashboard/guests', label: 'Guests', icon: <User size={15} /> },
    { href: '/dashboard/tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={15} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={15} /> },
    { href: '/dashboard/consumption', label: 'Consumption', icon: <Coffee size={15} /> },
  ],
  housekeeping: [
    { href: '/dashboard/staff', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={15} /> },
    { href: '/dashboard/tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={15} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={15} /> },
  ],
  security: [
    { href: '/dashboard/staff', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { href: '/dashboard/security', label: 'Security', icon: <Shield size={15} /> },
    { href: '/dashboard/tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={15} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={15} /> },
  ],
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#d4ab5a', manager: '#60a5fa', receptionist: '#34d399', housekeeping: '#a78bfa', security: '#f87171',
}

export default function Sidebar({ role, fullName, email }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navItems = NAV_ITEMS[role] || []
  const roleColor = ROLE_COLORS[role]
  const roleLabel = ROLE_CONFIG[role].label

  return (
    <aside style={{ width: '240px', minHeight: '100vh', background: '#1a1710', borderRight: '1px solid #2e2b1e', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, zIndex: 40 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #2e2b1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={16} color="#111008" strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '14px', fontWeight: 600, color: '#f4e4c1', lineHeight: 1.2 }}>Kayla City</div>
            <div style={{ fontSize: '10px', color: '#5c481f', letterSpacing: '0.08em' }}>APARTHOTEL</div>
          </div>
        </div>
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, #d4ab5a33, transparent)' }} />
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3a3728', padding: '8px 12px 6px' }}>Navigation</div>
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? roleColor : '#7a6e52', textDecoration: 'none', background: isActive ? `${roleColor}15` : 'transparent', border: isActive ? `1px solid ${roleColor}25` : '1px solid transparent', transition: 'all 0.15s' }}>
              <span style={{ color: isActive ? roleColor : '#5c481f' }}>{item.icon}</span>
              {item.label}
              {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', color: roleColor, opacity: 0.6 }} />}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding: '12px', borderTop: '1px solid #2e2b1e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#221f14', borderRadius: '10px', border: '1px solid #2e2b1e', marginBottom: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: roleColor, flexShrink: 0, boxShadow: `0 0 6px ${roleColor}80` }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4b48a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</div>
            <div style={{ fontSize: '11px', color: '#5c481f' }}>{roleLabel}</div>
          </div>
          <Shield size={12} color={roleColor} style={{ opacity: 0.6, flexShrink: 0 }} />
        </div>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', background: 'transparent', border: '1px solid transparent', borderRadius: '8px', color: '#5c481f', fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => { const t = e.currentTarget; t.style.background = 'rgba(248,113,113,0.08)'; t.style.borderColor = 'rgba(248,113,113,0.15)'; t.style.color = '#f87171' }}
          onMouseLeave={e => { const t = e.currentTarget; t.style.background = 'transparent'; t.style.borderColor = 'transparent'; t.style.color = '#5c481f' }}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  )
}
