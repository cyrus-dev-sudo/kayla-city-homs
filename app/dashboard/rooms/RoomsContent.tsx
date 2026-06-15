'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, BedDouble, Wrench, Sparkles, DoorOpen } from 'lucide-react'

interface Room {
  id: string
  room_number: string
  category: string
  floor: number
  rate: number
  status: string
  notes?: string
}

const STATUS_CONFIG = {
  available: { label: 'Available', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', icon: <DoorOpen size={14} /> },
  occupied: { label: 'Occupied', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', icon: <BedDouble size={14} /> },
  cleaning: { label: 'Cleaning', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', icon: <Sparkles size={14} /> },
  maintenance: { label: 'Maintenance', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', icon: <Wrench size={14} /> },
}

const CATEGORY_LABELS: Record<string, string> = {
  single: 'Single', double: 'Double', suite: 'Suite', apartment: 'Apartment', penthouse: 'Penthouse'
}

const INPUT_STYLE = {
  width: '100%', padding: '10px 14px',
  background: '#221f14', border: '1px solid #2e2b1e',
  borderRadius: '8px', color: '#f4e4c1', fontSize: '14px',
  outline: 'none', fontFamily: 'inherit',
} as React.CSSProperties

const LABEL_STYLE = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  color: '#7a6e52', marginBottom: '6px',
}

export default function RoomsContent({ rooms: initialRooms, canEdit }: { rooms: Room[], canEdit: boolean }) {
  const [rooms, setRooms] = useState(initialRooms)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ room_number: '', category: 'single', floor: '', rate: '', notes: '' })
  const supabase = createClient()
  const router = useRouter()

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter)

  const statusCounts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }

  async function updateStatus(room: Room, newStatus: string) {
    const { error } = await supabase.from('rooms').update({ status: newStatus }).eq('id', room.id)
    if (!error) setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: newStatus } : r))
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      room_number: form.room_number,
      category: form.category,
      floor: parseInt(form.floor) || null,
      rate: parseFloat(form.rate) || 0,
      notes: form.notes,
    }).select().single()

    if (!error && data) {
      setRooms(prev => [...prev, data].sort((a, b) => a.room_number.localeCompare(b.room_number)))
      setShowModal(false)
      setForm({ room_number: '', category: 'single', floor: '', rate: '', notes: '' })
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>
            Rooms
          </h2>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>{rooms.length} rooms total</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #b8923d, #d4ab5a)',
            color: '#111008', fontWeight: 700, fontSize: '13px',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
          }}>
            <Plus size={15} /> Add Room
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const config = status === 'all' ? { color: '#d4ab5a', bg: 'rgba(212,171,90,0.1)', border: 'rgba(212,171,90,0.2)' } : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
          const isActive = filter === status
          return (
            <button key={status} onClick={() => setFilter(status)} style={{
              padding: '7px 16px',
              background: isActive ? config.bg : 'transparent',
              border: `1px solid ${isActive ? config.border : '#2e2b1e'}`,
              borderRadius: '100px',
              fontSize: '12px', fontWeight: 600,
              color: isActive ? config.color : '#5c481f',
              cursor: 'pointer', fontFamily: 'inherit',
              textTransform: 'capitalize',
            }}>
              {status === 'all' ? 'All' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Room Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {filtered.map(room => {
          const config = STATUS_CONFIG[room.status as keyof typeof STATUS_CONFIG]
          return (
            <div key={room.id} style={{
              background: '#1a1710',
              border: `1px solid ${config.border}`,
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ height: '2px', background: `linear-gradient(90deg, ${config.color}, transparent)`, borderRadius: '2px', marginBottom: '16px' }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#f4e4c1', lineHeight: 1 }}>
                    {room.room_number}
                  </div>
                  <div style={{ fontSize: '11px', color: '#7a6e52', marginTop: '4px', textTransform: 'capitalize' }}>
                    {CATEGORY_LABELS[room.category]} · Floor {room.floor ?? '—'}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px',
                  background: config.bg,
                  border: `1px solid ${config.border}`,
                  borderRadius: '100px',
                  fontSize: '10px', fontWeight: 700,
                  color: config.color,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {config.icon}
                  {config.label}
                </div>
              </div>

              <div style={{ fontSize: '13px', color: '#d4ab5a', fontWeight: 600, marginBottom: '16px' }}>
                GH₵{room.rate.toFixed(2)}<span style={{ fontSize: '11px', color: '#5c481f', fontWeight: 400 }}>/night</span>
              </div>

              {/* Status change buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(STATUS_CONFIG).filter(([s]) => s !== room.status).map(([status, cfg]) => (
                  <button key={status} onClick={() => updateStatus(room, status)} style={{
                    padding: '4px 10px',
                    background: 'transparent',
                    border: `1px solid #2e2b1e`,
                    borderRadius: '6px',
                    fontSize: '10px', fontWeight: 600,
                    color: '#5c481f', cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2b1e'; e.currentTarget.style.color = '#5c481f' }}
                  >
                    → {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center' }}>
          <BedDouble size={40} color="#3a3728" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#5c481f', fontSize: '15px' }}>No rooms found</p>
        </div>
      )}

      {/* Add Room Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f4e4c1' }}>Add Room</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={addRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL_STYLE}>Room Number</label>
                  <input required value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="101" style={INPUT_STYLE} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Floor</label>
                  <input type="number" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} placeholder="1" style={INPUT_STYLE} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...INPUT_STYLE, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Rate per Night (GH₵)</label>
                <input type="number" required value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="150.00" style={INPUT_STYLE} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Adding...' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } } select option { background:#221f14; color:#f4e4c1; }`}</style>
    </div>
  )
}
