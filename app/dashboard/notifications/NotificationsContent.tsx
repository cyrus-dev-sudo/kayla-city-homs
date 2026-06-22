'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCheck, Check } from 'lucide-react'

interface Notification {
  id: string; title: string; message: string; read: boolean
  entity_type?: string; created_at: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ENTITY_COLORS: Record<string, string> = {
  check_in: '#4ade80', check_out: '#60a5fa', report: '#a78bfa',
  maintenance: '#fbbf24', incident: '#f87171', task: '#34d399', inventory: '#f97316',
}

export default function NotificationsContent({ notifications: init }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(init)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const supabase = createClient()

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications
  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Notifications</h2>
          <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{unreadCount} unread · {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', background: filter === f ? 'rgba(212,171,90,0.1)' : 'transparent',
            border: `1px solid ${filter === f ? 'rgba(212,171,90,0.3)' : '#2e2010'}`,
            borderRadius: '100px', fontSize: '12px', fontWeight: 600,
            color: filter === f ? '#a8702e' : '#7a6650', cursor: 'pointer', fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}>
            {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
          </button>
        ))}
      </div>

      <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <Bell size={36} color="#3a3220" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#7a6650', fontSize: '14px' }}>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const color = ENTITY_COLORS[n.entity_type || ''] || '#a8702e'
            return (
              <div key={n.id} style={{
                padding: '16px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid #2e2010' : 'none',
                background: n.read ? 'transparent' : 'rgba(212,171,90,0.02)',
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#221b10')}
                onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(212,171,90,0.02)')}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.read ? '#2e2010' : color, marginTop: '6px', flexShrink: 0, boxShadow: n.read ? 'none' : `0 0 6px ${color}60` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: n.read ? 400 : 600, color: n.read ? '#7a6650' : '#c4ab85', marginBottom: '4px' }}>{n.title}</div>
                  <div style={{ fontSize: '13px', color: '#7a6650', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: '11px', color: '#3a3220', marginTop: '6px' }}>{timeAgo(n.created_at)}</div>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '6px', fontSize: '11px', color: '#7a6650', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    <Check size={11} /> Read
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
