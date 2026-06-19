'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, BedDouble, Wrench, Sparkles, DoorOpen, Pencil } from 'lucide-react'

interface Room {
  id: string; room_number: string; category: string; floor: number; rate: number; status: string; notes?: string
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

const INPUT = { width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6650', marginBottom: '6px' }

export default function RoomsContent({ rooms: initialRooms, canEdit }: { rooms: Room[], canEdit: boolean }) {
  const [rooms, setRooms] = useState(initialRooms)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [addForm, setAddForm] = useState({ room_number: '', category: 'single', floor: '', rate: '', notes: '' })
  const [editForm, setEditForm] = useState({ room_number: '', category: 'single', floor: '', rate: '', notes: '' })
  const supabase = createClient()

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter)
  const statusCounts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }

  function openEdit(room: Room) {
    setEditRoom(room)
    setEditForm({ room_number: room.room_number, category: room.category, floor: String(room.floor ?? ''), rate: String(room.rate), notes: room.notes ?? '' })
  }

  async function updateStatus(room: Room, newStatus: string) {
    const { error } = await supabase.from('rooms').update({ status: newStatus }).eq('id', room.id)
    if (!error) setRooms(prev => prev.map(r => r.id === room.id ? { ...r, status: newStatus } : r))
  }

  async function addRoom(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const { data, error } = await supabase.from('rooms').insert({
      room_number: addForm.room_number, category: addForm.category,
      floor: parseInt(addForm.floor) || null, rate: parseFloat(addForm.rate) || 0, notes: addForm.notes,
    }).select().single()
    if (!error && data) {
      setRooms(prev => [...prev, data].sort((a, b) => a.room_number.localeCompare(b.room_number)))
      setShowAddModal(false)
      setAddForm({ room_number: '', category: 'single', floor: '', rate: '', notes: '' })
    }
    setLoading(false)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault(); if (!editRoom) return; setLoading(true)
    const updates = { room_number: editForm.room_number, category: editForm.category, floor: parseInt(editForm.floor) || null, rate: parseFloat(editForm.rate) || 0, notes: editForm.notes }
    const { error } = await supabase.from('rooms').update(updates).eq('id', editRoom.id)
    if (!error) {
      setRooms(prev => prev.map(r => r.id === editRoom.id ? { ...r, room_number: editForm.room_number, category: editForm.category, floor: parseInt(editForm.floor) || 0, rate: parseFloat(editForm.rate) || 0, notes: editForm.notes } : r))
      setEditRoom(null)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Rooms</h2>
          <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{rooms.length} rooms total</p>
        </div>
        {canEdit && (
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <Plus size={15} /> Add Room
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const config = status === 'all' ? { color: '#a8702e', bg: 'rgba(212,171,90,0.1)', border: 'rgba(212,171,90,0.2)' } : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
          const isActive = filter === status
          return (
            <button key={status} onClick={() => setFilter(status)} style={{ padding: '7px 16px', background: isActive ? config.bg : 'transparent', border: `1px solid ${isActive ? config.border : '#2e2010'}`, borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: isActive ? config.color : '#7a6650', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {status === 'all' ? 'All' : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Room Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
        {filtered.map(room => {
          const config = STATUS_CONFIG[room.status as keyof typeof STATUS_CONFIG]
          return (
            <div key={room.id} style={{ background: '#1a160c', border: `1px solid ${config.border}`, borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', transition: 'transform 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ height: '2px', background: `linear-gradient(90deg, ${config.color}, transparent)`, borderRadius: '2px', marginBottom: '16px' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#f0d3a8', lineHeight: 1 }}>{room.room_number}</div>
                  <div style={{ fontSize: '11px', color: '#7a6650', marginTop: '4px', textTransform: 'capitalize' }}>{CATEGORY_LABELS[room.category]} · Floor {room.floor ?? '—'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <div style={{ padding: '4px 10px', background: config.bg, border: `1px solid ${config.border}`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: config.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {config.icon}{config.label}
                  </div>
                  {canEdit && (
                    <button onClick={() => openEdit(room)} style={{ padding: '4px 8px', background: 'rgba(212,171,90,0.08)', border: '1px solid rgba(212,171,90,0.15)', borderRadius: '6px', color: '#93602a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'inherit' }}>
                      <Pencil size={10} /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#a8702e', fontWeight: 600, marginBottom: '16px' }}>
                GH₵{room.rate.toFixed(2)}<span style={{ fontSize: '11px', color: '#7a6650', fontWeight: 400 }}>/night</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {Object.entries(STATUS_CONFIG).filter(([s]) => s !== room.status).map(([status, cfg]) => (
                  <button key={status} onClick={() => updateStatus(room, status)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '6px', fontSize: '10px', fontWeight: 600, color: '#7a6650', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2010'; e.currentTarget.style.color = '#7a6650' }}>
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
          <BedDouble size={40} color="#3a3220" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#7a6650', fontSize: '15px' }}>No rooms found</p>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div><div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} /><h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>Add Room</h3></div>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>
            <form onSubmit={addRoom} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Room Number</label><input required value={addForm.room_number} onChange={e => setAddForm(f => ({ ...f, room_number: e.target.value }))} placeholder="101" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div><label style={LBL}>Floor</label><input type="number" value={addForm.floor} onChange={e => setAddForm(f => ({ ...f, floor: e.target.value }))} placeholder="1" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div><label style={LBL}>Category</label><select value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>{Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div><label style={LBL}>Rate per Night (GH₵)</label><input type="number" required value={addForm.rate} onChange={e => setAddForm(f => ({ ...f, rate: e.target.value }))} placeholder="150.00" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div><label style={LBL}>Notes</label><textarea value={addForm.notes} onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional..." rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Adding...' : 'Add Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {editRoom && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div><div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} /><h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>Edit Room {editRoom.room_number}</h3></div>
              <button onClick={() => setEditRoom(null)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Room Number</label><input required value={editForm.room_number} onChange={e => setEditForm(f => ({ ...f, room_number: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div><label style={LBL}>Floor</label><input type="number" value={editForm.floor} onChange={e => setEditForm(f => ({ ...f, floor: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              </div>
              <div><label style={LBL}>Category</label><select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>{Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
              <div><label style={LBL}>Rate per Night (GH₵)</label><input type="number" required value={editForm.rate} onChange={e => setEditForm(f => ({ ...f, rate: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div><label style={LBL}>Notes</label><textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setEditRoom(null)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221b10;color:#f0d3a8} input::placeholder,textarea::placeholder{color:#3a3220}`}</style>
    </div>
  )
}
