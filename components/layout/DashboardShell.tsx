import { UserRole } from '@/lib/roles'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import InstallBanner from './InstallBanner'

interface DashboardShellProps {
  role: UserRole
  fullName: string
  email: string
  children: React.ReactNode
}

export default function DashboardShell({ role, fullName, email, children }: DashboardShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#111008' }}>
      <div className="desktop-sidebar">
        <Sidebar role={role} fullName={fullName} email={email} />
      </div>
      <main className="dashboard-main" style={{
        marginLeft: '240px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {children}
      </main>
      <BottomNav role={role} fullName={fullName} />
      <InstallBanner />
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .dashboard-main {
            margin-left: 0 !important;
            padding-bottom: 70px;
          }
        }
      `}</style>
    </div>
  )
}
