'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Coffee, Check, Clock, ChefHat } from 'lucide-react'

interface Request {
  id: string; room_number: string; guest_name: string
  beverage?: string; bread?: string; egg?: string
  baked_beans: boolean; sausage: boolean; sugar: boolean; milk: boolean
  special_notes?: string; status: string; requested_at: string; fulfilled_at?: string
  fulfilled_by_profile?: { full_name: string }
}

const STATUS_CONFIG: { [k: string]: { label: string; color: string } } = {
  pending: { label: 'Pending', color: '#fbbf24' },
  prepared: { label: 'Prepared', color: '#60a5fa' },
  delivered: { label: 'Delivered', color: '#4ade80' },
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function BreakfastRequestsContent({ requests: init, currentUserId }: { requests: Request[]; currentUserId: string }) {
  const [requests, setRequests] = useState(init)
  const [filter, setFilter] = useState<string>('all')
  const supabase = createClient()

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const today = new Date().toISOString().split('T')[0]
  const todayCount = requests.filter(r => r.requested_at.startsWith(today)).length

  async function updateStatus(id: string, status: string) {
    await supabase.from('breakfast_requests').update({
      status,
      fulfilled_at: status === 'delivered' ? new Date().toISOString() : null,
      fulfilled_by: status === 'delivered' ? currentUserId : null,
    }).eq('id', id)
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  function buildOrderSummary(r: Request): string[] {
    const items: string[] = []
    if (r.beverage) items.push(r.beverage)
    if (r.bread) items.push(r.bread)
    if (r.egg) items.push(r.egg)
    if (r.baked_beans) items.push('Baked Beans')
    if (r.sausage) items.push('Sausage')
    if (r.sugar) items.push('Sugar')
    if (r.milk) items.push('Milk')
    return items
  }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Breakfast Requests</h2>
        <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{todayCount} requests today · {requests.filter(r => r.status === 'pending').length} pending</p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['all', 'pending', 'prepared', 'delivered'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', background: filter === s ? 'rgba(212,171,90,0.1)' : 'transparent',
            border: `1px solid ${filter === s ? 'rgba(212,171,90,0.3)' : '#2e2010'}`,
            borderRadius: '100px', fontSize: '12px', fontWeight: 600,
            color: filter === s ? '#a8702e' : '#7a6650', cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>
            {s} {s !== 'all' ? `(${requests.filter(r => r.status === s).length})` : `(${requests.length})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px' }}>
            <Coffee size={36} color="#3a3220" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#7a6650' }}>No breakfast requests</p>
          </div>
        )}
        {filtered.map(req => {
          const status = STATUS_CONFIG[req.status]
          const items = buildOrderSummary(req)
          return (
            <div key={req.id} style={{ background: '#1a160c', border: `1px solid ${status.color}25`, borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0d3a8' }}>Room {req.room_number}</div>
                  <div style={{ fontSize: '12px', color: '#7a6650' }}>{req.guest_name} · requested {formatTime(req.requested_at)}</div>
                </div>
                <span style={{ padding: '4px 10px', background: `${status.color}15`, border: `1px solid ${status.color}25`, borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: status.color }}>{status.label}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {items.length === 0 ? (
                  <span style={{ fontSize: '12px', color: '#3a3220' }}>No items selected</span>
                ) : items.map(item => (
                  <span key={item} style={{ padding: '4px 10px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '100px', fontSize: '12px', color: '#c4ab85' }}>{item}</span>
                ))}
              </div>

              {req.special_notes && (
                <div style={{ fontSize: '12px', color: '#7a6650', marginBottom: '12px', padding: '8px 12px', background: '#221b10', borderRadius: '8px' }}>
                  <strong style={{ color: '#7a6650' }}>Note:</strong> {req.special_notes}
                </div>
              )}

              {req.status !== 'delivered' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {req.status === 'pending' && (
                    <button onClick={() => updateStatus(req.id, 'prepared')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', fontSize: '12px', color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <ChefHat size={12} /> Mark Prepared
                    </button>
                  )}
                  {req.status === 'prepared' && (
                    <button onClick={() => updateStatus(req.id, 'delivered')} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', fontSize: '12px', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <Check size={12} /> Mark Delivered
                    </button>
                  )}
                </div>
              )}
              {req.status === 'delivered' && req.fulfilled_by_profile && (
                <div style={{ fontSize: '11px', color: '#3a3220' }}>Delivered by {req.fulfilled_by_profile.full_name}</div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
