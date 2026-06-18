'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/lib/roles'
import { Plus, X, FileText } from 'lucide-react'
import { sendNotification } from '@/lib/notify'

interface Report {
  id: string; report_type: string; shift: string; report_date: string; created_at: string; notes?: string
  submitted_by_profile?: { full_name: string }
  guests_checked_in?: number; guests_checked_out?: number; complaints?: string
  rooms_cleaned?: number; damaged_items?: string
  visitor_summary?: string; incidents?: string
  daily_summary?: string
}

const SHIFT_OPTS = ['morning', 'afternoon', 'night']
const INPUT = { width: '100%', padding: '10px 14px', background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#f4e4c1', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6e52', marginBottom: '6px' }
const TEXTAREA = { ...INPUT, resize: 'vertical' as const } as React.CSSProperties

function getCurrentShift(): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 14) return 'morning'
  if (h >= 14 && h < 22) return 'afternoon'
  return 'night'
}

export default function ReportsContent({ reports: initialReports, role, currentUserId }: {
  reports: Report[]; role: string; currentUserId: string
}) {
  const [reports, setReports] = useState(initialReports)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shift, setShift] = useState(getCurrentShift())
  const [form, setForm] = useState<Record<string, string>>({})
  const supabase = createClient()

  function getReportType(): string {
    if (role === 'receptionist') return 'receptionist'
    if (role === 'housekeeping') return 'housekeeping'
    if (role === 'security') return 'security'
    return 'manager'
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const reportType = getReportType()

    const payload: Record<string, any> = {
      submitted_by: currentUserId,
      report_type: reportType,
      shift,
      report_date: new Date().toISOString().split('T')[0],
      notes: form.notes,
    }

    if (reportType === 'receptionist') {
      payload.guests_checked_in = parseInt(form.guests_checked_in || '0')
      payload.guests_checked_out = parseInt(form.guests_checked_out || '0')
      payload.complaints = form.complaints
    } else if (reportType === 'housekeeping') {
      payload.rooms_cleaned = parseInt(form.rooms_cleaned || '0')
      payload.rooms_maintenance = parseInt(form.rooms_maintenance || '0')
      payload.damaged_items = form.damaged_items
    } else if (reportType === 'security') {
      payload.visitor_summary = form.visitor_summary
      payload.incidents = form.incidents
      payload.observations = form.observations
    } else {
      payload.daily_summary = form.daily_summary
      payload.staff_performance = form.staff_performance
      payload.operational_issues = form.operational_issues
      payload.recommendations = form.recommendations
    }

    const { data, error } = await supabase.from('reports').insert(payload)
      .select('*, submitted_by_profile:profiles!reports_submitted_by_fkey(full_name)').single()

    if (!error && data) {
      setReports(prev => [data, ...prev])
      setShowModal(false)
      setForm({})
      await sendNotification({
        title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report Submitted`,
        message: `A ${reportType} report was submitted for the ${shift} shift`,
        entity_type: 'report',
        entity_id: data.id,
      })
    }
    setLoading(false)
  }

  const f = (key: string) => form[key] || ''
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const REPORT_TYPE_COLORS: Record<string, string> = {
    receptionist: '#34d399', housekeeping: '#a78bfa', security: '#f87171', manager: '#60a5fa'
  }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>Reports</h2>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>{reports.length} reports submitted</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <Plus size={15} /> Submit Report
        </button>
      </div>

      {/* Reports list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {reports.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px' }}>
            <FileText size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#5c481f' }}>No reports yet</p>
          </div>
        )}
        {reports.map(report => {
          const color = REPORT_TYPE_COLORS[report.report_type] || '#d4ab5a'
          return (
            <div key={report.id} style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ padding: '3px 10px', background: `${color}15`, border: `1px solid ${color}25`, borderRadius: '100px', fontSize: '11px', fontWeight: 700, color, textTransform: 'capitalize' }}>{report.report_type}</span>
                  <span style={{ padding: '3px 10px', background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '100px', fontSize: '11px', color: '#7a6e52', textTransform: 'capitalize' }}>{report.shift}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#5c481f' }}>{new Date(report.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <div style={{ fontSize: '11px', color: '#3a3728' }}>{report.submitted_by_profile?.full_name}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {report.guests_checked_in !== undefined && <div style={{ padding: '10px', background: '#221f14', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#5c481f', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Checked In</div><div style={{ fontSize: '18px', fontWeight: 700, color: '#4ade80' }}>{report.guests_checked_in}</div></div>}
                {report.guests_checked_out !== undefined && <div style={{ padding: '10px', background: '#221f14', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#5c481f', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Checked Out</div><div style={{ fontSize: '18px', fontWeight: 700, color: '#f87171' }}>{report.guests_checked_out}</div></div>}
                {report.rooms_cleaned !== undefined && <div style={{ padding: '10px', background: '#221f14', borderRadius: '8px' }}><div style={{ fontSize: '10px', color: '#5c481f', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rooms Cleaned</div><div style={{ fontSize: '18px', fontWeight: 700, color: '#a78bfa' }}>{report.rooms_cleaned}</div></div>}
              </div>
              {(report.complaints || report.incidents || report.daily_summary || report.notes) && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#7a6e52', lineHeight: 1.6 }}>
                  {report.complaints && <div><strong style={{ color: '#5c481f' }}>Complaints:</strong> {report.complaints}</div>}
                  {report.incidents && <div><strong style={{ color: '#5c481f' }}>Incidents:</strong> {report.incidents}</div>}
                  {report.daily_summary && <div><strong style={{ color: '#5c481f' }}>Summary:</strong> {report.daily_summary}</div>}
                  {report.notes && <div><strong style={{ color: '#5c481f' }}>Notes:</strong> {report.notes}</div>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f4e4c1' }}>Submit Report</h3>
                <p style={{ fontSize: '12px', color: '#7a6e52', marginTop: '4px', textTransform: 'capitalize' }}>{getReportType()} Report</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}><X size={14} /></button>
            </div>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={LBL}>Shift</label>
                <select value={shift} onChange={e => setShift(e.target.value)} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                  {SHIFT_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>

              {getReportType() === 'receptionist' && <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Guests Checked In</label><input type="number" min="0" value={f('guests_checked_in')} onChange={set('guests_checked_in')} placeholder="0" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                  <div><label style={LBL}>Guests Checked Out</label><input type="number" min="0" value={f('guests_checked_out')} onChange={set('guests_checked_out')} placeholder="0" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                </div>
                <div><label style={LBL}>Complaints</label><textarea value={f('complaints')} onChange={set('complaints')} placeholder="Any complaints received..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
              </>}

              {getReportType() === 'housekeeping' && <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Rooms Cleaned</label><input type="number" min="0" value={f('rooms_cleaned')} onChange={set('rooms_cleaned')} placeholder="0" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                  <div><label style={LBL}>Rooms for Maintenance</label><input type="number" min="0" value={f('rooms_maintenance')} onChange={set('rooms_maintenance')} placeholder="0" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                </div>
                <div><label style={LBL}>Damaged / Missing Items</label><textarea value={f('damaged_items')} onChange={set('damaged_items')} placeholder="Describe any damaged or missing items..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
              </>}

              {getReportType() === 'security' && <>
                <div><label style={LBL}>Visitor Summary</label><textarea value={f('visitor_summary')} onChange={set('visitor_summary')} placeholder="Summary of visitors..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Incidents</label><textarea value={f('incidents')} onChange={set('incidents')} placeholder="Any security incidents..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Observations</label><textarea value={f('observations')} onChange={set('observations')} placeholder="General observations..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
              </>}

              {getReportType() === 'manager' && <>
                <div><label style={LBL}>Daily Summary *</label><textarea required value={f('daily_summary')} onChange={set('daily_summary')} placeholder="Overall summary of the day..." rows={3} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Staff Performance</label><textarea value={f('staff_performance')} onChange={set('staff_performance')} placeholder="Notes on staff performance..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Operational Issues</label><textarea value={f('operational_issues')} onChange={set('operational_issues')} placeholder="Any issues encountered..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
                <div><label style={LBL}>Recommendations</label><textarea value={f('recommendations')} onChange={set('recommendations')} placeholder="Suggestions for improvement..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>
              </>}

              <div><label style={LBL}>Additional Notes</label><textarea value={f('notes')} onChange={set('notes')} placeholder="Any additional notes..." rows={2} style={TEXTAREA} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} /></div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>{loading ? 'Submitting...' : 'Submit Report'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221f14;color:#f4e4c1} input::placeholder,textarea::placeholder{color:#3a3728}`}</style>
    </div>
  )
}
