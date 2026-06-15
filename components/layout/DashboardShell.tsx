import { UserRole } from '@/lib/roles'
import Sidebar from './Sidebar'

interface DashboardShellProps {
  role: UserRole
  fullName: string
  email: string
  children: React.ReactNode
}

export default function DashboardShell({ role, fullName, email, children }: DashboardShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#111008' }}>
      <Sidebar role={role} fullName={fullName} email={email} />
      <main style={{
        marginLeft: '240px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
