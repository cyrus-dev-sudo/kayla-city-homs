'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', data.user.id)
        .single()

      if (profile?.status === 'inactive') {
        await supabase.auth.signOut()
        setError('Your account has been deactivated. Contact the hotel owner.')
        setLoading(false)
        return
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single()

      const routes: Record<string, string> = {
        owner: '/dashboard/owner',
        manager: '/dashboard/manager',
        receptionist: '/dashboard/staff',
        housekeeping: '/dashboard/staff',
        security: '/dashboard/staff',
      }

      router.refresh()
      window.location.href = roleData?.role ? routes[roleData.role] : '/dashboard/staff'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5efe4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(185,138,74,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(21,36,61,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(21,36,61,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        {/* Hotel logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '88px',
            height: '88px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            filter: 'drop-shadow(0 8px 24px rgba(185,138,74,0.25))',
          }}>
            <Image src="/icons/logo-source.png" alt="Kayla City" width={88} height={88} style={{ objectFit: 'contain' }} priority />
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '26px',
            fontWeight: 600,
            color: '#15243d',
            letterSpacing: '0.02em',
            lineHeight: 1.2,
          }}>
            Kayla City ApartHotel
          </h1>
          <p style={{
            fontSize: '12px',
            color: '#94a0b0',
            marginTop: '6px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Operations Management
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e8ddc9',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(21,36,61,0.06)',
        }}>
          {/* Gold top bar */}
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, #b98a4a, transparent)',
            borderRadius: '2px',
            marginBottom: '28px',
          }} />

          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#5c6b80',
            marginBottom: '24px',
          }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              borderRadius: '8px',
              color: '#dc2626',
              fontSize: '13px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94a0b0',
                marginBottom: '8px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@kaylacity.com"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#faf6ee',
                  border: '1px solid #e8ddc9',
                  borderRadius: '8px',
                  color: '#15243d',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#b98a4a'}
                onBlur={e => e.target.style.borderColor = '#e8ddc9'}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#94a0b0',
                marginBottom: '8px',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 44px 11px 14px',
                    background: '#faf6ee',
                    border: '1px solid #e8ddc9',
                    borderRadius: '8px',
                    color: '#15243d',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => e.target.style.borderColor = '#b98a4a'}
                  onBlur={e => e.target.style.borderColor = '#e8ddc9'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a0b0',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '-8px' }}>
              <Link href="/reset-password" style={{
                fontSize: '12px',
                color: '#b98a4a',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#d9cbb0' : 'linear-gradient(135deg, #a8702e, #b98a4a)',
                color: loading ? '#94a0b0' : '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid #ffffff',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#94a0b0',
          marginTop: '24px',
        }}>
          Staff access only · Contact the owner for an account
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #b0a68f; }
      `}</style>
    </div>
  )
}
