'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, CheckCircle, Clock, AlertCircle, Circle } from 'lucide-react'

interface Task {
  id: string; title: string; description?: string; priority: string; status: string
  due_date?: string; created_at: string
  assigned_to_profile?: { full_name: string }
  assigned_by_profile?: { full_name: string }
}
interface Staff { id: string; full_name: string }

const PRIORITY_CONFIG = {
  low: { color: '#4ade80', label: 'Low' },
  medium: { color: '#fbbf24', label: 'Medium' },
  high: { color: '#f87171', label: 'High' },
  urgent: { color: '#f43f5e', label: 'Urgent' },
}

const STATUS_CONFIG = {
  pending: { color: '#fbbf24', label: 'Pending', icon: <Clock size={12} /> },
  in_progress: { color: '#60a5fa', label: 'In Progress', icon: <AlertCircle size={12} /> },
  completed: { color: '#4ade80', label: 'Completed', icon: <CheckCircle size={12} /> },
  cancelled: { color: '#7a6650', label: 'Cancelled', icon: <Circle size={12} /> },
}

const INPUT = { width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6650', marginBottom: '6px' }

export default function TasksContent({ tasks: initialTasks, staff, canAssign, currentUserId }: {
  tasks: Task[]; staff: Staff[]; canAssign: boolean; currentUserId: string
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', notes: '' })
  const supabase = createClient()

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('tasks').insert({
      title: form.title, description: form.description,
      assigned_to: form.assigned_to || null,
      assigned_by: currentUserId,
      priority: form.priority,
      due_date: form.due_date || null,
      notes: form.notes,
    }).select('*, assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name), assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name)').single()

    if (!error && data) {
      setTasks(prev => [data, ...prev])
      setShowModal(false)
      setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', notes: '' })
    }
    setLoading(false)
  }

  async function updateStatus(taskId: string, status: string) {
    await supabase.from('tasks').update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
  }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Tasks</h2>
          <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{tasks.filter(t => t.status === 'pending').length} pending · {tasks.filter(t => t.status === 'in_progress').length} in progress</p>
        </div>
        {canAssign && (
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <Plus size={15} /> Assign Task
          </button>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['all', 'pending', 'in_progress', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', background: filter === s ? 'rgba(212,171,90,0.1)' : 'transparent',
            border: `1px solid ${filter === s ? 'rgba(212,171,90,0.3)' : '#2e2010'}`,
            borderRadius: '100px', fontSize: '12px', fontWeight: 600,
            color: filter === s ? '#a8702e' : '#7a6650', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length})
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px' }}>
            <CheckCircle size={36} color="#3a3220" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#7a6650' }}>No tasks found</p>
          </div>
        )}
        {filtered.map(task => {
          const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG]
          const status = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]
          return (
            <div key={task.id} style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div style={{ width: '3px', alignSelf: 'stretch', background: priority.color, borderRadius: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4ab85', marginBottom: '4px' }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: '12px', color: '#7a6650' }}>{task.description}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
                    <span style={{ padding: '3px 8px', background: `${priority.color}15`, border: `1px solid ${priority.color}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: priority.color }}>{priority.label}</span>
                    <span style={{ padding: '3px 8px', background: `${status.color}15`, border: `1px solid ${status.color}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: status.color, display: 'flex', alignItems: 'center', gap: '3px' }}>{status.icon}{status.label}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#7a6650', marginBottom: '12px' }}>
                  {task.assigned_to_profile && <span>→ {task.assigned_to_profile.full_name}</span>}
                  {task.assigned_by_profile && <span>by {task.assigned_by_profile.full_name}</span>}
                  {task.due_date && <span>Due: {new Date(task.due_date).toLocaleDateString('en-GB')}</span>}
                </div>
                {/* Status actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {task.status === 'pending' && <button onClick={() => updateStatus(task.id, 'in_progress')} style={{ padding: '4px 10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '6px', fontSize: '11px', color: '#60a5fa', cursor: 'pointer', fontFamily: 'inherit' }}>Start</button>}
                  {task.status === 'in_progress' && <button onClick={() => updateStatus(task.id, 'completed')} style={{ padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '6px', fontSize: '11px', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit' }}>Complete</button>}
                  {canAssign && task.status !== 'cancelled' && <button onClick={() => updateStatus(task.id, 'cancelled')} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '6px', fontSize: '11px', color: '#7a6650', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Assign Task Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>Assign Task</h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>
            <form onSubmit={createTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={LBL}>Task Title *</label><input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Clean Room 201" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div><label style={LBL}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task details..." rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={LBL}>Assign To</label>
                  <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>
                    <option value="">All Staff</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
                <div><label style={LBL}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>
                    {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={LBL}>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Assigning...' : 'Assign Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221b10;color:#f0d3a8} input::placeholder,textarea::placeholder{color:#3a3220}`}</style>
    </div>
  )
}
