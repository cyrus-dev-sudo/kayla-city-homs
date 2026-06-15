'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Building2, ArrowLeft, Mail } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (resetError) {
      setError('Failed to send reset email. Please try again.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111008',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(212,171,90,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '60px', height: '60px',
            background: 'linear-gradient(135deg, #b8923d, #d4ab5a)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 32px rgba(212,171,90,0.2)',
          }}>
            <Building2 size={28} color="#111008" strokeWidth={1.5} />
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '24px', fontWeight: 600, color: '#f4e4c1',
          }}>
            Reset Password
          </h1>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '6px' }}>
            Kayla City ApartHotel
          </p>
        </div>

        <div style={{
          background: '#1a1710',
          border: '1px solid #2e2b1e',
          borderRadius: '16px',
          padding: '32px',
        }}>
          <div style={{
            height: '2px',
            background: 'linear-gradient(90deg, #d4ab5a, transparent)',
            borderRadius: '2px',
            marginBottom: '28px',
          }} />

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '52px', height: '52px',
                background: 'rgba(74,222,128,0.1)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Mail size={24} color="#4ade80" />
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4e4c1', marginBottom: '8px' }}>
                Check your email
              </h3>
              <p style={{ fontSize: '13px', color: '#7a6e52', lineHeight: 1.6 }}>
                We sent a password reset link to <strong style={{ color: '#c4b48a' }}>{email}</strong>.
                Check your inbox and follow the instructions.
              </p>
              <Link href="/login" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '24px',
                fontSize: '13px',
                color: '#8a6c2e',
                textDecoration: 'none',
              }}>
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: '#7a6e52', marginBottom: '24px', lineHeight: 1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: '8px',
                  color: '#f87171',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#7a6e52', marginBottom: '8px',
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    style={{
                      width: '100%', padding: '11px 14px',
                      background: '#221f14',
                      border: '1px solid #2e2b1e',
                      borderRadius: '8px',
                      color: '#f4e4c1', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = '#b8923d'}
                    onBlur={e => e.target.style.borderColor = '#2e2b1e'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px',
                    background: loading ? '#3d3016' : 'linear-gradient(135deg, #b8923d, #d4ab5a)',
                    color: loading ? '#7a6e52' : '#111008',
                    fontWeight: 700, fontSize: '13px',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    border: 'none', borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '13px', color: '#8a6c2e', textDecoration: 'none',
                }}>
                  <ArrowLeft size={14} /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`input::placeholder { color: #3a3728; }`}</style>
    </div>
  )
}
