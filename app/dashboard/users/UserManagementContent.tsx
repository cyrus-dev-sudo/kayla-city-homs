'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserRole, ROLE_CONFIG } from '@/lib/roles'
import { Plus, X, UserCheck, UserX, Users, Search } from 'lucide-react'

interface StaffMember {
  id: string
  full_name: string
  email: string
  phone?: string
  status: string
  created_at: string
  role: UserRole | null
}

const ROLE_COLORS: Record<string, string> = {
  manager: '#60a5fa',
  receptionist: '#34d399',
  housekeeping: '#a78bfa',
  security: '#f87171',
}

const INPUT_STYLE = {
  width: '100%',
  padding: '11px 14px',
  background: '#221b10',
  border: '1px solid #2e2010',
  borderRadius: '8px',
  color: '#f0d3a8',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
} as React.CSSProperties

const LABEL_STYLE = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#7a6650',
  marginBottom: '8px',
} as React.CSSProperties

export default function UserManagementContent({ staff: initialStaff }: { staff: StaffMember[] }) {
  const [staff, setStaff] = useState(initialStaff)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'receptionist' as UserRole,
  })
  const supabase = createClient()
  const router = useRouter()

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.role && s.role.toLowerCase().includes(search.toLowerCase()))
  )

  async function createStaff(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create auth user via Supabase Admin API — we use a server action workaround
      // by calling our own API route
      const res = await fetch('/api/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create staff account')
        setLoading(false)
        return
      }

      setSuccess(`Account created for ${form.full_name}`)
      setShowModal(false)
      setForm({ full_name: '', email: '', phone: '', password: '', role: 'receptionist' })
      router.refresh()

      // Update local state optimistically
      setStaff(prev => [{
        id: data.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        status: 'active',
        created_at: new Date().toISOString(),
        role: form.role,
      }, ...prev])

      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function toggleStatus(member: StaffMember) {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', member.id)

    if (!error) {
      setStaff(prev => prev.map(s =>
        s.id === member.id ? { ...s, status: newStatus } : s
      ))
    }
  }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '28px', fontWeight: 600, color: '#f0d3a8',
          }}>
            Staff Accounts
          </h2>
          <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>
            {staff.length} registered · {staff.filter(s => s.status === 'active').length} active
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #93602a, #a8702e)',
            color: '#111008', fontWeight: 700, fontSize: '13px',
            letterSpacing: '0.04em',
            border: 'none', borderRadius: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(212,171,90,0.15)',
          }}
        >
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {success && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: '8px',
          color: '#4ade80',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          ✓ {success}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '360px' }}>
        <Search size={14} color="#7a6650" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search staff..."
          style={{ ...INPUT_STYLE, paddingLeft: '36px' }}
          onFocus={e => e.target.style.borderColor = '#93602a'}
          onBlur={e => e.target.style.borderColor = '#2e2010'}
        />
      </div>

      {/* Table */}
      <div style={{
        background: '#1a160c',
        border: '1px solid #2e2010',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center' }}>
            <Users size={40} color="#3a3220" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', color: '#7a6650', fontWeight: 500 }}>
              {search ? 'No staff match your search' : 'No staff accounts yet'}
            </p>
            <p style={{ fontSize: '12px', color: '#3a3220', marginTop: '6px' }}>
              {search ? 'Try a different name or role' : 'Click "Add Staff" to create the first account'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#221b10' }}>
                {['Staff Member', 'Role', 'Status', 'Phone', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#7a6650', borderBottom: '1px solid #2e2010',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => {
                const roleColor = member.role ? ROLE_COLORS[member.role] || '#a8702e' : '#7a6650'
                const roleLabel = member.role ? ROLE_CONFIG[member.role].label : 'No Role'
                return (
                  <tr key={member.id}
                    style={{ borderBottom: '1px solid #2e2010', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#221b10')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '8px',
                          background: `${roleColor}20`,
                          border: `1px solid ${roleColor}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: roleColor,
                          flexShrink: 0,
                        }}>
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4ab85' }}>{member.full_name}</div>
                          <div style={{ fontSize: '11px', color: '#7a6650' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 10px',
                        background: `${roleColor}15`,
                        border: `1px solid ${roleColor}25`,
                        borderRadius: '100px',
                        fontSize: '11px', fontWeight: 600, color: roleColor,
                      }}>
                        {roleLabel}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '12px', fontWeight: 600,
                        color: member.status === 'active' ? '#4ade80' : '#f87171',
                      }}>
                        <span style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: member.status === 'active' ? '#4ade80' : '#f87171',
                        }} />
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>
                      {member.phone || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>
                      {new Date(member.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => toggleStatus(member)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 12px',
                          background: member.status === 'active'
                            ? 'rgba(248,113,113,0.08)'
                            : 'rgba(74,222,128,0.08)',
                          border: member.status === 'active'
                            ? '1px solid rgba(248,113,113,0.2)'
                            : '1px solid rgba(74,222,128,0.2)',
                          borderRadius: '6px',
                          fontSize: '11px', fontWeight: 600,
                          color: member.status === 'active' ? '#f87171' : '#4ade80',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {member.status === 'active'
                          ? <><UserX size={11} /> Deactivate</>
                          : <><UserCheck size={11} /> Activate</>
                        }
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#1a160c',
            border: '1px solid #2e2010',
            borderRadius: '16px',
            padding: '32px',
            width: '100%', maxWidth: '480px',
            animation: 'modalIn 0.2s ease',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f0d3a8', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Add Staff Member
                </h3>
                <p style={{ fontSize: '12px', color: '#7a6650', marginTop: '4px' }}>Create a new staff account</p>
              </div>
              <button onClick={() => { setShowModal(false); setError('') }}
                style={{
                  background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#7a6650',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: '8px', color: '#f87171',
                fontSize: '13px', marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={createStaff} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL_STYLE}>Full Name</label>
                  <input
                    required value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    placeholder="Jane Mensah"
                    style={INPUT_STYLE}
                    onFocus={e => e.target.style.borderColor = '#93602a'}
                    onBlur={e => e.target.style.borderColor = '#2e2010'}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Phone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0241234567"
                    style={INPUT_STYLE}
                    onFocus={e => e.target.style.borderColor = '#93602a'}
                    onBlur={e => e.target.style.borderColor = '#2e2010'}
                  />
                </div>
              </div>

              <div>
                <label style={LABEL_STYLE}>Email Address</label>
                <input
                  type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@kaylacity.com"
                  style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = '#93602a'}
                  onBlur={e => e.target.style.borderColor = '#2e2010'}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>Password</label>
                <input
                  type="password" required minLength={8} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 8 characters"
                  style={INPUT_STYLE}
                  onFocus={e => e.target.style.borderColor = '#93602a'}
                  onBlur={e => e.target.style.borderColor = '#2e2010'}
                />
              </div>

              <div>
                <label style={LABEL_STYLE}>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  style={{
                    ...INPUT_STYLE,
                    appearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a6e52' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px',
                  }}
                  onFocus={e => e.target.style.borderColor = '#93602a'}
                  onBlur={e => e.target.style.borderColor = '#2e2010'}
                >
                  {(['manager', 'receptionist', 'housekeeping', 'security'] as UserRole[]).map(r => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].label} — {ROLE_CONFIG[r].description}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => { setShowModal(false); setError('') }}
                  style={{
                    flex: 1, padding: '11px',
                    background: 'transparent',
                    border: '1px solid #2e2010',
                    borderRadius: '8px', color: '#7a6650',
                    fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{
                    flex: 2, padding: '11px',
                    background: loading ? '#3d3016' : 'linear-gradient(135deg, #93602a, #a8702e)',
                    color: loading ? '#7a6650' : '#111008',
                    fontWeight: 700, fontSize: '13px',
                    letterSpacing: '0.04em',
                    border: 'none', borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        input::placeholder, textarea::placeholder { color: #3a3220; }
        select option { background: #221b10; color: #f0d3a8; }
      `}</style>
    </div>
  )
}
