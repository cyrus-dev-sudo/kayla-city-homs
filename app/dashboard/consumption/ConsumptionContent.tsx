'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Coffee } from 'lucide-react'

interface Record {
  id: string; item_type: string; item_name: string; quantity: number; shift: string; created_at: string; unit_price: number
  rooms?: { room_number: string }
  recorded_by_profile?: { full_name: string }
}
interface Room { id: string; room_number: string }

function getShift() {
  const h = new Date().getHours()
  if (h >= 6 && h < 14) return 'morning'
  if (h >= 14 && h < 22) return 'afternoon'
  return 'night'
}

const INPUT = { width: '100%', padding: '10px 14px', background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#f4e4c1', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6e52', marginBottom: '6px' }

const ITEMS = {
  breakfast: ['Continental Breakfast', 'Full English', 'Fruit Platter', 'Cereal', 'Toast', 'Eggs'],
  drink: ['Water', 'Coke', 'Fanta', 'Sprite', 'Tea', 'Coffee', 'Juice', 'Beer', 'Wine'],
  other: ['Room Service', 'Laundry', 'Extra Towels', 'Other'],
}

export default function ConsumptionContent({ records: init, rooms, currentUserId }: { records: Record[]; rooms: Room[]; currentUserId: string }) {
  const [records, setRecords] = useState(init)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ room_id: rooms[0]?.id ?? '', item_type: 'breakfast', item_name: '', quantity: '1', unit_price: '', shift: getShift(), notes: '' })
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data } = await supabase.from('consumption_records').insert({
      room_id: form.room_id, recorded_by: currentUserId,
      item_type: form.item_type, item_name: form.item_name,
      quantity: parseInt(form.quantity), unit_price: parseFloat(form.unit_price) || 0,
      shift: form.shift, notes: form.notes,
    }).select('*, rooms(room_number), recorded_by_profile:profiles!consumption_records_recorded_by_fkey(full_name)').single()
    if (data) { setRecords(prev => [data, ...prev]); setShowModal(false); setForm({ room_id: rooms[0]?.id ?? '', item_type: 'breakfast', item_name: '', quantity: '1', unit_price: '', shift: getShift(), notes: '' }) }
    setLoading(false)
  }

  const TYPE_COLORS: { [key: string]: string } = { breakfast: '#fbbf24', drink: '#60a5fa', other: '#a78bfa' }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>Consumption</h2>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>Today: {records.filter(r => r.created_at.startsWith(new Date().toISOString().split('T')[0])).length} records</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={15} /> Record Item
        </button>
      </div>

      <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', overflow: 'hidden' }}>
        {records.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><Coffee size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#5c481f' }}>No consumption records yet</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#221f14' }}>
                {['Room', 'Item', 'Type', 'Qty', 'Price', 'Shift', 'Time', 'By'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5c481f', borderBottom: '1px solid #2e2b1e' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const color = TYPE_COLORS[r.item_type] || '#d4ab5a'
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #2e2b1e' }} onMouseEnter={e => (e.currentTarget.style.background = '#221f14')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#c4b48a' }}>Room {r.rooms?.room_number}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#c4b48a' }}>{r.item_name}</td>
                    <td style={{ padding: '12px 14px' }}><span style={{ padding: '2px 8px', background: `${color}15`, border: `1px solid ${color}25`, borderRadius: '100px', fontSize: '11px', fontWeight: 600, color, textTransform: 'capitalize' }}>{r.item_type}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#7a6e52' }}>×{r.quantity}</td>
                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#d4ab5a' }}>GH₵{(r.unit_price * r.quantity).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#7a6e52', textTransform: 'capitalize' }}>{r.shift}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#5c481f' }}>{new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#5c481f' }}>{r.recorded_by_profile?.full_name}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div><div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)', marginBottom: '16px', borderRadius: '2px' }} /><h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f4e4c1' }}>Record Consumption</h3></div>
              <button onClick={() => setShowModal(false)} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}><X size={14} /></button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Room</label>
                  <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                    {rooms.length === 0 ? <option value="">No occupied rooms</option> : rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
                  </select>
                </div>
                <div><label style={LBL}>Type</label>
                  <select value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value, item_name: '' }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                    <option value="breakfast">Breakfast</option>
                    <option value="drink">Drink</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div><label style={LBL}>Item *</label>
                <select value={form.item_name} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                  <option value="">Select item...</option>
                  {ITEMS[form.item_type as keyof typeof ITEMS]?.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Qty</label><input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Unit Price</label><input type="number" value={form.unit_price} onChange={e => setForm(f => ({ ...f, unit_price: e.target.value }))} placeholder="0.00" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Shift</label>
                  <select value={form.shift} onChange={e => setForm(f => ({ ...f, shift: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                    {['morning', 'afternoon', 'night'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading || !form.item_name} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Recording...' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221f14;color:#f4e4c1}`}</style>
    </div>
  )
}
