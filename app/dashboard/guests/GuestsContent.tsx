'use client'

import { useState } from 'react'
import { Search, User, X, Phone, Mail, CreditCard, MapPin, Calendar } from 'lucide-react'

interface Reservation {
  id: string; status: string; check_in_date: string; check_out_date?: string
  checked_in_at: string; checked_out_at?: string; rate_at_checkin?: number; num_guests: number
  rooms?: { room_number: string; category: string }
}

interface Guest {
  id: string; full_name: string; phone?: string; email?: string
  id_type?: string; id_number?: string; nationality?: string; address?: string
  notes?: string; created_at: string
  reservations?: Reservation[]
}

const STATUS_COLORS: { [k: string]: string } = {
  checked_in: '#4ade80', checked_out: '#7a6e52', cancelled: '#f87171',
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GuestsContent({ guests }: { guests: Guest[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Guest | null>(null)

  const filtered = guests.filter(g =>
    g.id_number?.toLowerCase().includes(search.toLowerCase()) ||
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  )

  const totalStays = (g: Guest) => g.reservations?.length ?? 0
  const totalSpent = (g: Guest) => g.reservations?.reduce((sum, r) => sum + (r.rate_at_checkin ?? 0), 0) ?? 0
  const lastStay = (g: Guest) => g.reservations?.[0]

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>Guests</h2>
        <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>{guests.length} guest profiles</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '440px' }}>
        <Search size={14} color="#5c481f" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID number, name or phone..." style={{ width: '100%', padding: '11px 14px 11px 36px', background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#f4e4c1', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '24px' }}>
        <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <User size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#5c481f', fontSize: '14px' }}>{search ? 'No guests match your search' : 'No guests yet'}</p>
              {search && <p style={{ color: '#3a3728', fontSize: '12px', marginTop: '6px' }}>Try searching by ID number for best results</p>}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#221f14' }}>
                {['Guest', 'ID Number', 'Nationality', 'Stays', 'Last Room', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5c481f', borderBottom: '1px solid #2e2b1e' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(guest => {
                  const last = lastStay(guest)
                  const isSelected = selected?.id === guest.id
                  return (
                    <tr key={guest.id} onClick={() => setSelected(isSelected ? null : guest)} style={{ borderBottom: '1px solid #2e2b1e', cursor: 'pointer', background: isSelected ? 'rgba(212,171,90,0.05)' : 'transparent' }} onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#221f14' }} onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(212,171,90,0.05)' : 'transparent' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#d4ab5a', flexShrink: 0 }}>{guest.full_name.charAt(0).toUpperCase()}</div>
                          <div><div style={{ fontSize: '13px', fontWeight: 600, color: '#c4b48a' }}>{guest.full_name}</div><div style={{ fontSize: '11px', color: '#5c481f' }}>{guest.phone || '—'}</div></div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#d4ab5a', background: 'rgba(212,171,90,0.08)', padding: '2px 8px', borderRadius: '4px' }}>{guest.id_number || '—'}</span></td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6e52' }}>{guest.nationality || '—'}</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#f4e4c1' }}>{totalStays(guest)}</span></td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6e52' }}>{last?.rooms ? `Room ${last.rooms.room_number}` : '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {last ? <span style={{ padding: '3px 8px', background: `${STATUS_COLORS[last.status]}15`, border: `1px solid ${STATUS_COLORS[last.status]}25`, borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: STATUS_COLORS[last.status] }}>{last.status.replace('_', ' ')}</span> : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', overflow: 'hidden', height: 'fit-content', position: 'sticky', top: '80px' }}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)' }} />
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#d4ab5a' }}>{selected.full_name.charAt(0).toUpperCase()}</div>
                  <div><div style={{ fontSize: '16px', fontWeight: 700, color: '#f4e4c1' }}>{selected.full_name}</div><div style={{ fontSize: '11px', color: '#5c481f', marginTop: '2px' }}>Guest since {formatDate(selected.created_at)}</div></div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}><X size={12} /></button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: '#221f14', borderRadius: '8px', border: '1px solid #2e2b1e' }}>
                  <div style={{ fontSize: '10px', color: '#5c481f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Stays</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#d4ab5a' }}>{totalStays(selected)}</div>
                </div>
                <div style={{ padding: '12px', background: '#221f14', borderRadius: '8px', border: '1px solid #2e2b1e' }}>
                  <div style={{ fontSize: '10px', color: '#5c481f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#d4ab5a' }}>GH₵{totalSpent(selected).toFixed(0)}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5c481f', marginBottom: '10px' }}>Contact & ID</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4b48a' }}><Phone size={12} color="#5c481f" />{selected.phone}</div>}
                  {selected.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4b48a' }}><Mail size={12} color="#5c481f" />{selected.email}</div>}
                  {selected.id_number && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4b48a' }}><CreditCard size={12} color="#5c481f" />{selected.id_type}: <span style={{ fontFamily: 'monospace', color: '#d4ab5a' }}>{selected.id_number}</span></div>}
                  {selected.nationality && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4b48a' }}><User size={12} color="#5c481f" />{selected.nationality}</div>}
                  {selected.address && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4b48a' }}><MapPin size={12} color="#5c481f" />{selected.address}</div>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5c481f', marginBottom: '10px' }}>Stay History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {!selected.reservations?.length && <p style={{ fontSize: '12px', color: '#3a3728' }}>No stays recorded</p>}
                  {selected.reservations?.map(res => (
                    <div key={res.id} style={{ padding: '12px', background: '#221f14', borderRadius: '8px', border: '1px solid #2e2b1e' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4b48a' }}>Room {res.rooms?.room_number} — {res.rooms?.category}</div>
                        <span style={{ padding: '2px 8px', background: `${STATUS_COLORS[res.status]}15`, border: `1px solid ${STATUS_COLORS[res.status]}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 600, color: STATUS_COLORS[res.status] }}>{res.status.replace('_', ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#5c481f' }}>
                        <Calendar size={10} />{formatDate(res.check_in_date)}{res.check_out_date && <> → {formatDate(res.check_out_date)}</>}
                      </div>
                      {res.rate_at_checkin && <div style={{ fontSize: '12px', color: '#d4ab5a', marginTop: '4px', fontWeight: 600 }}>GH₵{res.rate_at_checkin}/night</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} input::placeholder{color:#3a3728}`}</style>
    </div>
  )
}
