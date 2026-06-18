'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Wrench } from 'lucide-react'
import { sendNotification } from '@/lib/notify'

interface Request {
  id: string; issue_description: string; priority: string; status: string; created_at: string; notes?: string
  rooms?: { room_number: string }
  reported_by_profile?: { full_name: string }
}
interface Room { id: string; room_number: string }

const PRIORITY = { low: '#4ade80', medium: '#fbbf24', high: '#f97316', critical: '#f43f5e' }
const STATUS = { open: { color: '#f87171', label: 'Open' }, in_progress: { color: '#fbbf24', label: 'In Progress' }, fixed: { color: '#4ade80', label: 'Fixed' } }

const INPUT = { width: '100%', padding: '10px 14px', background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#f4e4c1', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6e52', marginBottom: '6px' }

export default function MaintenanceContent({ requests: init, rooms, canManage, currentUserId }: { requests: Request[]; rooms: Room[]; canManage: boolean; currentUserId: string }) {
  const [requests, setRequests] = useState(init)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ room_id: rooms[0]?.id ?? '', issue_description: '', priority: 'medium', notes: '' })
  const supabase = createClient()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data } = await supabase.from('maintenance_requests').insert({ ...form, reported_by: currentUserId }).select('*, rooms(room_number), reported_by_profile:profiles!maintenance_requests_reported_by_fkey(full_name)').single()
    if (data) {
      setRequests(prev => [data, ...prev]); setShowModal(false); setForm({ room_id: rooms[0]?.id ?? '', issue_description: '', priority: 'medium', notes: '' })
      await sendNotification({
        title: `Maintenance Request — ${form.priority.toUpperCase()}`,
        message: `${form.issue_description} (Room ${data.rooms?.room_number ?? '—'})`,
        entity_type: 'maintenance',
        entity_id: data.id,
      })
    }
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('maintenance_requests').update({ status, resolved_at: status === 'fixed' ? new Date().toISOString() : null }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    const req = requests.find(r => r.id === id)
    if (req) {
      await sendNotification({
        title: `Maintenance ${status === 'fixed' ? 'Fixed' : 'In Progress'}`,
        message: `${req.issue_description} has been marked as ${status.replace('_', ' ')}`,
        entity_type: 'maintenance',
        entity_id: id,
      })
    }
  }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>Maintenance</h2>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>{requests.filter(r => r.status === 'open').length} open · {requests.filter(r => r.status === 'in_progress').length} in progress</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={15} /> Report Issue
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.length === 0 && <div style={{ padding: '48px', textAlign: 'center', background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px' }}><Wrench size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#5c481f' }}>No maintenance requests</p></div>}
        {requests.map(req => {
          const pc = PRIORITY[req.priority as keyof typeof PRIORITY] || '#d4ab5a'
          const sc = STATUS[req.status as keyof typeof STATUS] || STATUS.open
          return (
            <div key={req.id} style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', padding: '20px', display: 'flex', gap: '16px' }}>
              <div style={{ width: '3px', alignSelf: 'stretch', background: pc, borderRadius: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4b48a', marginBottom: '4px' }}>{req.issue_description}</div>
                    <div style={{ fontSize: '11px', color: '#5c481f' }}>Room {req.rooms?.room_number ?? '—'} · by {req.reported_by_profile?.full_name} · {new Date(req.created_at).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ padding: '3px 8px', background: `${pc}15`, border: `1px solid ${pc}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: pc, textTransform: 'capitalize' }}>{req.priority}</span>
                    <span style={{ padding: '3px 8px', background: `${sc.color}15`, border: `1px solid ${sc.color}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: sc.color }}>{sc.label}</span>
                  </div>
                </div>
                {canManage && req.status !== 'fixed' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {req.status === 'open' && <button onClick={() => updateStatus(req.id, 'in_progress')} style={{ padding: '4px 10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '6px', fontSize: '11px', color: '#fbbf24', cursor: 'pointer', fontFamily: 'inherit' }}>Start Work</button>}
                    {req.status === 'in_progress' && <button onClick={() => updateStatus(req.id, 'fixed')} style={{ padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', fontSize: '11px', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit' }}>Mark Fixed</button>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div><div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)', marginBottom: '16px', borderRadius: '2px' }} /><h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f4e4c1' }}>Report Issue</h3></div>
              <button onClick={() => setShowModal(false)} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}><X size={14} /></button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Room</label>
                  <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                    {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
                  </select>
                </div>
                <div><label style={LBL}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                    {Object.keys(PRIORITY).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={LBL}>Issue Description *</label><textarea required value={form.issue_description} onChange={e => setForm(f => ({ ...f, issue_description: e.target.value }))} placeholder="Describe the issue..." rows={3} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
              <div><label style={LBL}>Notes</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Submitting...' : 'Submit Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221f14;color:#f4e4c1} textarea::placeholder{color:#3a3728}`}</style>
    </div>
  )
}
