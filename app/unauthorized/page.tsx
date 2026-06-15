import Link from 'next/link'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#111008',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <ShieldOff size={28} color="#f87171" />
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: '28px', fontWeight: 600, color: '#f4e4c1', marginBottom: '12px',
        }}>
          Access Denied
        </h1>
        <p style={{ fontSize: '14px', color: '#7a6e52', lineHeight: 1.6, marginBottom: '28px' }}>
          You don't have permission to view this page. Contact the hotel owner if you believe this is a mistake.
        </p>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 24px',
          background: 'linear-gradient(135deg, #b8923d, #d4ab5a)',
          color: '#111008', fontWeight: 700, fontSize: '13px',
          borderRadius: '8px', textDecoration: 'none',
        }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
