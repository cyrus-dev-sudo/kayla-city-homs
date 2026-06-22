'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, User, X, Phone, Mail, CreditCard, MapPin, Calendar, Pencil } from 'lucide-react'

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
  checked_in: '#4ade80', checked_out: '#7a6650', cancelled: '#f87171',
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function GuestsContent({ guests: initialGuests }: { guests: Guest[] }) {
  const [guests, setGuests] = useState(initialGuests)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Guest | null>(null)
  const [editGuest, setEditGuest] = useState<Guest | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '', id_type: '', id_number: '', nationality: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const filtered = guests.filter(g =>
    g.id_number?.toLowerCase().includes(search.toLowerCase()) ||
    g.full_name.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search)
  )

  const totalStays = (g: Guest) => g.reservations?.length ?? 0
  const totalSpent = (g: Guest) => g.reservations?.reduce((sum, r) => sum + (r.rate_at_checkin ?? 0), 0) ?? 0
  const lastStay = (g: Guest) => g.reservations?.[0]

  function openEdit(guest: Guest) {
    setEditGuest(guest)
    setEditForm({
      full_name: guest.full_name, phone: guest.phone ?? '', email: guest.email ?? '',
      id_type: guest.id_type ?? '', id_number: guest.id_number ?? '',
      nationality: guest.nationality ?? '', address: guest.address ?? '', notes: guest.notes ?? '',
    })
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editGuest) return
    setLoading(true)
    const updates = {
      full_name: editForm.full_name, phone: editForm.phone || null, email: editForm.email || null,
      id_type: editForm.id_type || null, id_number: editForm.id_number || null,
      nationality: editForm.nationality || null, address: editForm.address || null, notes: editForm.notes || null,
    }
    const { error } = await supabase.from('guests').update(updates).eq('id', editGuest.id)
    if (!error) {
      const updated = { ...editGuest, full_name: editForm.full_name, phone: editForm.phone, email: editForm.email, id_type: editForm.id_type, id_number: editForm.id_number, nationality: editForm.nationality, address: editForm.address, notes: editForm.notes }
      setGuests(prev => prev.map(g => g.id === editGuest.id ? updated : g))
      if (selected?.id === editGuest.id) setSelected(updated)
      setEditGuest(null)
    }
    setLoading(false)
  }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Guests</h2>
        <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{guests.length} guest profiles</p>
      </div>

      <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '440px' }}>
        <Search size={14} color="#7a6650" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID number, name or phone..." style={{ width: '100%', padding: '11px 14px 11px 36px', background: '#1a160c', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} />
      </div>

      <div className="guests-detail-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: '24px' }}>
        <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <User size={36} color="#3a3220" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#7a6650', fontSize: '14px' }}>{search ? 'No guests match your search' : 'No guests yet'}</p>
              {search && <p style={{ color: '#3a3220', fontSize: '12px', marginTop: '6px' }}>Try searching by ID number for best results</p>}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead><tr style={{ background: '#221b10' }}>
                {['Guest', 'ID Number', 'Nationality', 'Stays', 'Last Room', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', borderBottom: '1px solid #2e2010' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(guest => {
                  const last = lastStay(guest)
                  const isSelected = selected?.id === guest.id
                  return (
                    <tr key={guest.id} onClick={() => setSelected(isSelected ? null : guest)} style={{ borderBottom: '1px solid #2e2010', cursor: 'pointer', background: isSelected ? 'rgba(212,171,90,0.05)' : 'transparent' }} onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#221b10' }} onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(212,171,90,0.05)' : 'transparent' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#a8702e', flexShrink: 0 }}>{guest.full_name.charAt(0).toUpperCase()}</div>
                          <div><div style={{ fontSize: '13px', fontWeight: 600, color: '#c4ab85' }}>{guest.full_name}</div><div style={{ fontSize: '11px', color: '#7a6650' }}>{guest.phone || '—'}</div></div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#a8702e', background: 'rgba(212,171,90,0.08)', padding: '2px 8px', borderRadius: '4px' }}>{guest.id_number || '—'}</span></td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>{guest.nationality || '—'}</td>
                      <td style={{ padding: '14px 16px' }}><span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: 700, color: '#f0d3a8' }}>{totalStays(guest)}</span></td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>{last?.rooms ? `Room ${last.rooms.room_number}` : '—'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {last ? <span style={{ padding: '3px 8px', background: `${STATUS_COLORS[last.status]}15`, border: `1px solid ${STATUS_COLORS[last.status]}25`, borderRadius: '100px', fontSize: '11px', fontWeight: 600, color: STATUS_COLORS[last.status] }}>{last.status.replace('_', ' ')}</span> : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {selected && (
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', overflow: 'hidden', height: 'fit-content', position: 'sticky', top: '80px' }}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)' }} />
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#a8702e' }}>{selected.full_name.charAt(0).toUpperCase()}</div>
                  <div><div style={{ fontSize: '16px', fontWeight: 700, color: '#f0d3a8' }}>{selected.full_name}</div><div style={{ fontSize: '11px', color: '#7a6650', marginTop: '2px' }}>Guest since {formatDate(selected.created_at)}</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => openEdit(selected)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(168,112,46,0.08)', border: '1px solid rgba(168,112,46,0.15)', borderRadius: '6px', color: '#93602a', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                    <Pencil size={11} /> Edit
                  </button>
                  <button onClick={() => setSelected(null)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={12} /></button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: '#221b10', borderRadius: '8px', border: '1px solid #2e2010' }}>
                  <div style={{ fontSize: '10px', color: '#7a6650', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Stays</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#a8702e' }}>{totalStays(selected)}</div>
                </div>
                <div style={{ padding: '12px', background: '#221b10', borderRadius: '8px', border: '1px solid #2e2010' }}>
                  <div style={{ fontSize: '10px', color: '#7a6650', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: '#a8702e' }}>GH₵{totalSpent(selected).toFixed(0)}</div>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '10px' }}>Contact & ID</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4ab85' }}><Phone size={12} color="#7a6650" />{selected.phone}</div>}
                  {selected.email && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4ab85' }}><Mail size={12} color="#7a6650" />{selected.email}</div>}
                  {selected.id_number && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4ab85' }}><CreditCard size={12} color="#7a6650" />{selected.id_type}: <span style={{ fontFamily: 'monospace', color: '#a8702e' }}>{selected.id_number}</span></div>}
                  {selected.nationality && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4ab85' }}><User size={12} color="#7a6650" />{selected.nationality}</div>}
                  {selected.address && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#c4ab85' }}><MapPin size={12} color="#7a6650" />{selected.address}</div>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '10px' }}>Stay History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {!selected.reservations?.length && <p style={{ fontSize: '12px', color: '#3a3220' }}>No stays recorded</p>}
                  {selected.reservations?.map(res => (
                    <div key={res.id} style={{ padding: '12px', background: '#221b10', borderRadius: '8px', border: '1px solid #2e2010' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4ab85' }}>Room {res.rooms?.room_number} — {res.rooms?.category}</div>
                        <span style={{ padding: '2px 8px', background: `${STATUS_COLORS[res.status]}15`, border: `1px solid ${STATUS_COLORS[res.status]}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 600, color: STATUS_COLORS[res.status] }}>{res.status.replace('_', ' ')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a6650' }}>
                        <Calendar size={10} />{formatDate(res.check_in_date)}{res.check_out_date && <> → {formatDate(res.check_out_date)}</>}
                      </div>
                      {res.rate_at_checkin && <div style={{ fontSize: '12px', color: '#a8702e', marginTop: '4px', fontWeight: 600 }}>GH₵{res.rate_at_checkin}/night</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {editGuest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div><div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} /><h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>Edit Guest</h3></div>
              <button onClick={() => setEditGuest(null)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>Full Name *</label><input required value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>Phone</label><input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>ID Type</label><input value={editForm.id_type} onChange={e => setEditForm(f => ({ ...f, id_type: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>ID Number</label><input value={editForm.id_number} onChange={e => setEditForm(f => ({ ...f, id_number: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>Nationality</label><input value={editForm.nationality} onChange={e => setEditForm(f => ({ ...f, nationality: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>Email</label><input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>Address</label><input value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div><label style={{ display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', marginBottom: '6px' }}>Notes</label><textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setEditGuest(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} input::placeholder,textarea::placeholder{color:#3a3220}`}</style>
    </div>
  )
}
