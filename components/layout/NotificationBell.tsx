'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, Check, CheckCheck } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  entity_type?: string
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data)
  }, [supabase])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function getEntityColor(type?: string) {
    const colors: Record<string, string> = {
      check_in: '#4ade80', check_out: '#60a5fa', report: '#a78bfa',
      maintenance: '#fbbf24', incident: '#f87171', task: '#34d399', inventory: '#f97316',
    }
    return colors[type || ''] || '#a8702e'
  }

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'relative',
          width: '36px', height: '36px',
          background: showPanel ? 'rgba(212,171,90,0.1)' : '#221b10',
          border: `1px solid ${showPanel ? 'rgba(212,171,90,0.3)' : '#2e2010'}`,
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: showPanel ? '#a8702e' : '#7a6650',
          transition: 'all 0.15s',
        }}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#f43f5e',
            color: 'white',
            fontSize: '10px', fontWeight: 700,
            minWidth: '16px', height: '16px',
            borderRadius: '100px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            border: '1px solid #1a160c',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowPanel(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />

          <div style={{
            position: 'absolute', top: '44px', right: 0,
            width: '360px',
            background: '#1a160c',
            border: '1px solid #2e2010',
            borderRadius: '12px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #2e2010',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#c4ab85' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ padding: '2px 8px', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '100px', fontSize: '11px', fontWeight: 700, color: '#f43f5e' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '6px', fontSize: '11px', color: '#7a6650', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCheck size={11} /> Mark all read
                  </button>
                )}
                <button onClick={() => setShowPanel(false)} style={{ width: '26px', height: '26px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}>
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Bell size={28} color="#3a3220" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '13px', color: '#7a6650' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => {
                  const color = getEntityColor(n.entity_type)
                  return (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #2e2010',
                        background: n.read ? 'transparent' : 'rgba(212,171,90,0.03)',
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#221b10')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(212,171,90,0.03)')}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: n.read ? 'transparent' : color, marginTop: '6px', flexShrink: 0, boxShadow: n.read ? 'none' : `0 0 4px ${color}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: n.read ? 400 : 600, color: n.read ? '#7a6650' : '#c4ab85', marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: '#7a6650', lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '11px', color: '#3a3220', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
                      </div>
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} style={{ background: 'transparent', border: 'none', color: '#7a6650', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid #2e2010' }}>
              <Link href="/dashboard/notifications" onClick={() => setShowPanel(false)} style={{ fontSize: '12px', color: '#93602a', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                View all notifications →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
