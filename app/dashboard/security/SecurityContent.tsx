'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, X, Users, Car, Shield, AlertTriangle, LogOut } from 'lucide-react'
import { sendNotification } from '@/lib/notify'

const INPUT = { width: '100%', padding: '10px 14px', background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#f4e4c1', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6e52', marginBottom: '6px' }
const TEXTAREA = { ...INPUT, resize: 'vertical' as const } as React.CSSProperties

function getCurrentShift() {
  const h = new Date().getHours()
  if (h >= 6 && h < 14) return 'morning'
  if (h >= 14 && h < 22) return 'afternoon'
  return 'night'
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function SecurityContent({ visitors: initV, vehicles: initVeh, patrols: initP, incidents: initI, currentUserId, role }: {
  visitors: any[]; vehicles: any[]; patrols: any[]; incidents: any[]; currentUserId: string; role: string
}) {
  const [tab, setTab] = useState<'visitors' | 'vehicles' | 'patrols' | 'incidents'>('visitors')
  const [visitors, setVisitors] = useState(initV)
  const [vehicles, setVehicles] = useState(initVeh)
  const [patrols, setPatrols] = useState(initP)
  const [incidents, setIncidents] = useState(initI)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Forms
  const [vForm, setVForm] = useState({ visitor_name: '', visiting_guest: '', room_number: '', purpose: '', notes: '' })
  const [carForm, setCarForm] = useState({ plate_number: '', vehicle_type: 'Car', color: '', notes: '' })
  const [pForm, setPForm] = useState({ areas_covered: '', observations: '', shift: getCurrentShift() })
  const [iForm, setIForm] = useState({ incident_type: 'Theft', location: '', description: '', persons_involved: '', action_taken: '', severity: 'low' })

  const supabase = createClient()

  const TABS = [
    { key: 'visitors', label: 'Visitors', icon: <Users size={14} />, count: visitors.filter(v => !v.time_out).length },
    { key: 'vehicles', label: 'Vehicles', icon: <Car size={14} />, count: vehicles.filter(v => !v.time_out).length },
    { key: 'patrols', label: 'Patrols', icon: <Shield size={14} />, count: patrols.length },
    { key: 'incidents', label: 'Incidents', icon: <AlertTriangle size={14} />, count: incidents.filter(i => i.status === 'open').length },
  ]

  async function logVisitor(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const { data } = await supabase.from('visitor_log').insert({ ...vForm, recorded_by: currentUserId }).select('*, recorded_by_profile:profiles!visitor_log_recorded_by_fkey(full_name)').single()
    if (data) { setVisitors(p => [data, ...p]); setShowModal(false); setVForm({ visitor_name: '', visiting_guest: '', room_number: '', purpose: '', notes: '' }) }
    setLoading(false)
  }

  async function logVehicle(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const { data } = await supabase.from('vehicle_log').insert({ ...carForm, recorded_by: currentUserId }).select('*, recorded_by_profile:profiles!vehicle_log_recorded_by_fkey(full_name)').single()
    if (data) { setVehicles(p => [data, ...p]); setShowModal(false); setCarForm({ plate_number: '', vehicle_type: 'Car', color: '', notes: '' }) }
    setLoading(false)
  }

  async function logPatrol(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const { data } = await supabase.from('patrol_rounds').insert({ ...pForm, officer_id: currentUserId }).select('*, officer:profiles!patrol_rounds_officer_id_fkey(full_name)').single()
    if (data) { setPatrols(p => [data, ...p]); setShowModal(false); setPForm({ areas_covered: '', observations: '', shift: getCurrentShift() }) }
    setLoading(false)
  }

  async function logIncident(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const { data } = await supabase.from('incident_reports').insert({ ...iForm, reported_by: currentUserId, manager_notified: true }).select('*, reported_by_profile:profiles!incident_reports_reported_by_fkey(full_name)').single()
    if (data) {
      setIncidents(p => [data, ...p]); setShowModal(false); setIForm({ incident_type: 'Theft', location: '', description: '', persons_involved: '', action_taken: '', severity: 'low' })
      await sendNotification({
        title: `Security Incident — ${iForm.incident_type}`,
        message: `${iForm.severity.toUpperCase()} severity incident at ${iForm.location || 'unspecified location'}. ${iForm.description.slice(0, 80)}${iForm.description.length > 80 ? '...' : ''}`,
        entity_type: 'incident',
        entity_id: data.id,
        roles: ['owner', 'manager'],
      })
    }
    setLoading(false)
  }

  async function signOut(id: string, table: 'visitor_log' | 'vehicle_log') {
    await supabase.from(table).update({ time_out: new Date().toISOString() }).eq('id', id)
    if (table === 'visitor_log') setVisitors(p => p.map(v => v.id === id ? { ...v, time_out: new Date().toISOString() } : v))
    else setVehicles(p => p.map(v => v.id === id ? { ...v, time_out: new Date().toISOString() } : v))
  }

  const SEVERITY_COLORS: { [k: string]: string } = { low: '#4ade80', medium: '#fbbf24', high: '#f97316', critical: '#f43f5e' }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>Security</h2>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>
            {visitors.filter(v => !v.time_out).length} visitors in · {vehicles.filter(v => !v.time_out).length} vehicles in · {incidents.filter(i => i.status === 'open').length} open incidents
          </p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={15} /> Log Entry
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #2e2b1e', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px', background: 'transparent', border: 'none',
            borderBottom: tab === t.key ? '2px solid #d4ab5a' : '2px solid transparent',
            fontSize: '13px', fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? '#d4ab5a' : '#5c481f',
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px',
          }}>
            {t.icon} {t.label}
            {t.count > 0 && <span style={{ padding: '1px 6px', background: tab === t.key ? 'rgba(212,171,90,0.2)' : '#221f14', borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: tab === t.key ? '#d4ab5a' : '#7a6e52' }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Visitors Tab */}
      {tab === 'visitors' && (
        <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', overflow: 'hidden' }}>
          {visitors.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}><Users size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#5c481f' }}>No visitors logged today</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#221f14' }}>
                {['Visitor', 'Seeing', 'Room', 'Purpose', 'Time In', 'Time Out', 'Action'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5c481f', borderBottom: '1px solid #2e2b1e' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {visitors.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #2e2b1e' }} onMouseEnter={e => (e.currentTarget.style.background = '#221f14')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: 600, color: '#c4b48a' }}>{v.visitor_name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#7a6e52' }}>{v.visiting_guest}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#7a6e52' }}>{v.room_number || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#7a6e52' }}>{v.purpose || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#5c481f' }}>{formatTime(v.time_in)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: v.time_out ? '#4ade80' : '#fbbf24' }}>{v.time_out ? formatTime(v.time_out) : 'Still in'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {!v.time_out && (
                        <button onClick={() => signOut(v.id, 'visitor_log')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', fontSize: '11px', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <LogOut size={10} /> Sign Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Vehicles Tab */}
      {tab === 'vehicles' && (
        <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', overflow: 'hidden' }}>
          {vehicles.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}><Car size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#5c481f' }}>No vehicles logged</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#221f14' }}>
                {['Plate', 'Type', 'Color', 'Time In', 'Time Out', 'Action'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5c481f', borderBottom: '1px solid #2e2b1e' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid #2e2b1e' }} onMouseEnter={e => (e.currentTarget.style.background = '#221f14')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px' }}><span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#d4ab5a', background: 'rgba(212,171,90,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(212,171,90,0.2)' }}>{v.plate_number}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', color: '#c4b48a' }}>{v.vehicle_type}</td>
                    <td style={{ padding: '12px 14px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#7a6e52' }}>{v.color}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: '#5c481f' }}>{formatTime(v.time_in)}</td>
                    <td style={{ padding: '12px 14px', fontSize: '11px', color: v.time_out ? '#4ade80' : '#fbbf24' }}>{v.time_out ? formatTime(v.time_out) : 'Still in'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {!v.time_out && (
                        <button onClick={() => signOut(v.id, 'vehicle_log')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '6px', fontSize: '11px', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <LogOut size={10} /> Exit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Patrols Tab */}
      {tab === 'patrols' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {patrols.length === 0 && <div style={{ padding: '48px', textAlign: 'center', background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px' }}><Shield size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#5c481f' }}>No patrol rounds logged</p></div>}
          {patrols.map(p => (
            <div key={p.id} style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4b48a' }}>{p.officer?.full_name} — {p.shift} shift</div>
                <div style={{ fontSize: '11px', color: '#5c481f' }}>{formatTime(p.started_at)}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#7a6e52', marginBottom: '6px' }}><strong style={{ color: '#5c481f' }}>Areas:</strong> {p.areas_covered}</div>
              {p.observations && <div style={{ fontSize: '12px', color: '#7a6e52' }}><strong style={{ color: '#5c481f' }}>Observations:</strong> {p.observations}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Incidents Tab */}
      {tab === 'incidents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {incidents.length === 0 && <div style={{ padding: '48px', textAlign: 'center', background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px' }}><AlertTriangle size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#5c481f' }}>No incidents reported</p></div>}
          {incidents.map(i => {
            const sc = SEVERITY_COLORS[i.severity] || '#d4ab5a'
            return (
              <div key={i.id} style={{ background: '#1a1710', border: `1px solid ${sc}30`, borderRadius: '12px', padding: '20px' }}>
                <div style={{ height: '2px', background: `linear-gradient(90deg, ${sc}, transparent)`, marginBottom: '16px', borderRadius: '2px' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#c4b48a', marginBottom: '4px' }}>{i.incident_type}</div>
                    <div style={{ fontSize: '11px', color: '#5c481f' }}>by {i.reported_by_profile?.full_name} · {formatTime(i.created_at)} · {i.location || 'No location'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ padding: '3px 8px', background: `${sc}15`, border: `1px solid ${sc}25`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: sc, textTransform: 'capitalize' }}>{i.severity}</span>
                    <span style={{ padding: '3px 8px', background: i.status === 'open' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)', border: `1px solid ${i.status === 'open' ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: i.status === 'open' ? '#f87171' : '#4ade80' }}>{i.status}</span>
                    {i.manager_notified && <span style={{ padding: '3px 8px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '100px', fontSize: '10px', fontWeight: 700, color: '#60a5fa' }}>Manager Notified</span>}
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#7a6e52', lineHeight: 1.6, marginBottom: '8px' }}>{i.description}</p>
                {i.persons_involved && <div style={{ fontSize: '12px', color: '#7a6e52' }}><strong style={{ color: '#5c481f' }}>Persons involved:</strong> {i.persons_involved}</div>}
                {i.action_taken && <div style={{ fontSize: '12px', color: '#7a6e52', marginTop: '4px' }}><strong style={{ color: '#5c481f' }}>Action taken:</strong> {i.action_taken}</div>}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f4e4c1' }}>
                  {tab === 'visitors' ? 'Log Visitor' : tab === 'vehicles' ? 'Log Vehicle' : tab === 'patrols' ? 'Log Patrol Round' : 'Report Incident'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}><X size={14} /></button>
            </div>

            {/* Visitor Form */}
            {tab === 'visitors' && (
              <form onSubmit={logVisitor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={LBL}>Visitor Name *</label><input required value={vForm.visitor_name} onChange={e => setVForm(f => ({ ...f, visitor_name: e.target.value }))} placeholder="John Doe" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Visiting (Guest Name) *</label><input required value={vForm.visiting_guest} onChange={e => setVForm(f => ({ ...f, visiting_guest: e.target.value }))} placeholder="Name of guest they're seeing" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Room Number</label><input value={vForm.room_number} onChange={e => setVForm(f => ({ ...f, room_number: e.target.value }))} placeholder="101" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                  <div><label style={LBL}>Purpose</label><input value={vForm.purpose} onChange={e => setVForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Visit, delivery..." style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Logging...' : 'Log Visitor'}</button>
                </div>
              </form>
            )}

            {/* Vehicle Form */}
            {tab === 'vehicles' && (
              <form onSubmit={logVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={LBL}>Plate Number *</label><input required value={carForm.plate_number} onChange={e => setCarForm(f => ({ ...f, plate_number: e.target.value.toUpperCase() }))} placeholder="GR-1234-24" style={{ ...INPUT, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Vehicle Type *</label>
                    <select required value={carForm.vehicle_type} onChange={e => setCarForm(f => ({ ...f, vehicle_type: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                      {['Car', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bus', 'Taxi', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Color *</label><input required value={carForm.color} onChange={e => setCarForm(f => ({ ...f, color: e.target.value }))} placeholder="Black, White..." style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                </div>
                <div><label style={LBL}>Notes</label><input value={carForm.notes} onChange={e => setCarForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Logging...' : 'Log Vehicle'}</button>
                </div>
              </form>
            )}

            {/* Patrol Form */}
            {tab === 'patrols' && (
              <form onSubmit={logPatrol} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div><label style={LBL}>Shift</label>
                  <select value={pForm.shift} onChange={e => setPForm(f => ({ ...f, shift: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                    {['morning', 'afternoon', 'night'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
                <div><label style={LBL}>Areas Covered *</label><textarea required value={pForm.areas_covered} onChange={e => setPForm(f => ({ ...f, areas_covered: e.target.value }))} placeholder="Ground floor, parking, pool area, floors 1-3..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Observations</label><textarea value={pForm.observations} onChange={e => setPForm(f => ({ ...f, observations: e.target.value }))} placeholder="Everything normal, or note anything unusual..." rows={3} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Logging...' : 'Log Patrol'}</button>
                </div>
              </form>
            )}

            {/* Incident Form */}
            {tab === 'incidents' && (
              <form onSubmit={logIncident} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '10px 14px', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '8px', fontSize: '12px', color: '#60a5fa' }}>
                  ℹ This incident will be flagged as manager-notified automatically.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Incident Type *</label>
                    <select required value={iForm.incident_type} onChange={e => setIForm(f => ({ ...f, incident_type: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                      {['Theft', 'Fight', 'Fire', 'Medical Emergency', 'Trespassing', 'Vandalism', 'Suspicious Activity', 'Noise Complaint', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Severity</label>
                    <select value={iForm.severity} onChange={e => setIForm(f => ({ ...f, severity: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                      {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={LBL}>Location</label><input value={iForm.location} onChange={e => setIForm(f => ({ ...f, location: e.target.value }))} placeholder="Parking lot, Room 201, Lobby..." style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Description *</label><textarea required value={iForm.description} onChange={e => setIForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what happened..." rows={3} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Persons Involved</label><input value={iForm.persons_involved} onChange={e => setIForm(f => ({ ...f, persons_involved: e.target.value }))} placeholder="Names or descriptions..." style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Action Taken</label><textarea value={iForm.action_taken} onChange={e => setIForm(f => ({ ...f, action_taken: e.target.value }))} placeholder="What did you do about it..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Reporting...' : 'Submit Incident'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221f14;color:#f4e4c1} input::placeholder,textarea::placeholder{color:#3a3728}`}</style>
    </div>
  )
}
