'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/roles'
import {
  LayoutDashboard, Users, LogOut, ChevronRight, Shield, BedDouble,
  UserPlus, ClipboardList, Wrench, Coffee, CheckSquare, User, Bell, Package, Menu, X
} from 'lucide-react'

interface BottomNavProps {
  role: UserRole
  fullName: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

// Primary items shown directly in the bottom bar (max 4 + More)
const PRIMARY_NAV: Record<UserRole, NavItem[]> = {
  owner: [
    { href: '/dashboard/owner', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={20} /> },
    { href: '/dashboard/checkin', label: 'Check-In', icon: <UserPlus size={20} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  ],
  manager: [
    { href: '/dashboard/manager', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={20} /> },
    { href: '/dashboard/checkin', label: 'Check-In', icon: <UserPlus size={20} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  ],
  receptionist: [
    { href: '/dashboard/staff', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/checkin', label: 'Check-In', icon: <UserPlus size={20} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={20} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
  ],
  housekeeping: [
    { href: '/dashboard/staff', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/rooms', label: 'Rooms', icon: <BedDouble size={20} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={20} /> },
  ],
  security: [
    { href: '/dashboard/staff', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { href: '/dashboard/security', label: 'Security', icon: <Shield size={20} /> },
    { href: '/dashboard/tasks', label: 'Tasks', icon: <CheckSquare size={20} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={20} /> },
  ],
}

// Everything else goes into the "More" sheet
const MORE_NAV: Record<UserRole, NavItem[]> = {
  owner: [
    { href: '/dashboard/guests', label: 'Guests', icon: <User size={18} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={18} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { href: '/dashboard/consumption', label: 'Consumption', icon: <Coffee size={18} /> },
    { href: '/dashboard/security', label: 'Security', icon: <Shield size={18} /> },
    { href: '/dashboard/inventory', label: 'Inventory', icon: <Package size={18} /> },
    { href: '/dashboard/breakfast-requests', label: 'Breakfast Orders', icon: <Coffee size={18} /> },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { href: '/dashboard/users', label: 'Staff Accounts', icon: <Users size={18} /> },
  ],
  manager: [
    { href: '/dashboard/guests', label: 'Guests', icon: <User size={18} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={18} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { href: '/dashboard/consumption', label: 'Consumption', icon: <Coffee size={18} /> },
    { href: '/dashboard/security', label: 'Security', icon: <Shield size={18} /> },
    { href: '/dashboard/inventory', label: 'Inventory', icon: <Package size={18} /> },
    { href: '/dashboard/breakfast-requests', label: 'Breakfast Orders', icon: <Coffee size={18} /> },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
  receptionist: [
    { href: '/dashboard/guests', label: 'Guests', icon: <User size={18} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <ClipboardList size={18} /> },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { href: '/dashboard/consumption', label: 'Consumption', icon: <Coffee size={18} /> },
    { href: '/dashboard/breakfast-requests', label: 'Breakfast Orders', icon: <Coffee size={18} /> },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
  housekeeping: [
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
  security: [
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { href: '/dashboard/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#a8702e', manager: '#60a5fa', receptionist: '#34d399', housekeeping: '#a78bfa', security: '#f87171',
}

export default function BottomNav({ role, fullName }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showMore, setShowMore] = useState(false)
  const supabase = createClient()

  const primaryItems = PRIMARY_NAV[role] || []
  const moreItems = MORE_NAV[role] || []
  const roleColor = ROLE_COLORS[role]

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isMoreActive = moreItems.some(item => item.href === pathname)

  return (
    <>
      {/* Bottom nav bar - mobile only */}
      <nav className="mobile-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1a160c',
        borderTop: '1px solid #2e2010',
        display: 'none',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {primaryItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '4px', padding: '10px 4px 8px',
                color: isActive ? roleColor : '#7a6650',
                textDecoration: 'none',
              }}>
                {item.icon}
                <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
              </Link>
            )
          })}
          <button onClick={() => setShowMore(true)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '4px', padding: '10px 4px 8px',
            background: 'none', border: 'none',
            color: isMoreActive ? roleColor : '#7a6650',
            fontFamily: 'inherit', cursor: 'pointer',
          }}>
            <Menu size={20} />
            <span style={{ fontSize: '10px' }}>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {showMore && (
        <div className="mobile-more-sheet" style={{
          position: 'fixed', inset: 0, zIndex: 60, display: 'none',
        }}>
          <div onClick={() => setShowMore(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: '#1a160c', borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
            border: '1px solid #2e2010', borderBottom: 'none',
            maxHeight: '75vh', overflowY: 'auto',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#c4ab85' }}>{fullName}</div>
                <div style={{ fontSize: '11px', color: '#7a6650' }}>More options</div>
              </div>
              <button onClick={() => setShowMore(false)} style={{ width: '32px', height: '32px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a6650', cursor: 'pointer' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {moreItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMore(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '13px 14px', borderRadius: '10px',
                    background: isActive ? `${roleColor}15` : 'transparent',
                    border: isActive ? `1px solid ${roleColor}25` : '1px solid transparent',
                    color: isActive ? roleColor : '#c4ab85',
                    textDecoration: 'none', fontSize: '14px', fontWeight: isActive ? 600 : 400,
                  }}>
                    {item.icon}
                    {item.label}
                    {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                  </Link>
                )
              })}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid #2e2010', marginTop: '8px' }}>
              <button onClick={handleLogout} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                padding: '13px 14px', borderRadius: '10px',
                background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
                color: '#f87171', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-bottom-nav { display: block !important; }
          .mobile-more-sheet { display: block !important; }
        }
      `}</style>
    </>
  )
}
