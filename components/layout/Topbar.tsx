import { UserRole, ROLE_CONFIG } from '@/lib/roles'
import NotificationBell from './NotificationBell'

interface TopbarProps {
  title: string
  subtitle?: string
  role: UserRole
  children?: React.ReactNode
}

const ROLE_COLORS: Record<UserRole, string> = {
  owner: '#a8702e', manager: '#60a5fa', receptionist: '#34d399', housekeeping: '#a78bfa', security: '#f87171',
}

export default function Topbar({ title, subtitle, role, children }: TopbarProps) {
  const roleColor = ROLE_COLORS[role]
  const roleLabel = ROLE_CONFIG[role].label

  return (
    <header className="dashboard-topbar" style={{
      height: '60px', padding: '0 32px',
      borderBottom: '1px solid #2e2010',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#1a160c', position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '18px', fontWeight: 600, color: '#f0d3a8', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
        {subtitle && <p className="topbar-subtitle" style={{ fontSize: '11px', color: '#7a6650', marginTop: '2px' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {children}
        <NotificationBell />
        <div className="topbar-role-badge" style={{ padding: '4px 12px', background: `${roleColor}15`, border: `1px solid ${roleColor}30`, borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: roleColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {roleLabel}
        </div>
      </div>
      <style>{`
        @media (max-width: 480px) {
          .dashboard-topbar { padding: 0 16px; }
          .topbar-subtitle { display: none; }
          .topbar-role-badge { display: none; }
        }
      `}</style>
    </header>
  )
}
