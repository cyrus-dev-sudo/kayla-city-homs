'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UserPlus, X, Pen, RotateCcw, LogOut } from 'lucide-react'

interface Room { id: string; room_number: string; category: string; rate: number }
interface Reservation {
  id: string; status: string; checked_in_at: string; num_guests: number
  guests: { full_name: string; phone: string; id_number: string }
  rooms: { room_number: string; category: string }
}

const INPUT = {
  width: '100%', padding: '10px 14px',
  background: '#221f14', border: '1px solid #2e2b1e',
  borderRadius: '8px', color: '#f4e4c1', fontSize: '14px',
  outline: 'none', fontFamily: 'inherit',
} as React.CSSProperties

const LBL = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase' as const,
  color: '#7a6e52', marginBottom: '6px',
}

export default function CheckInContent({ availableRooms, activeReservations, staffId }: {
  availableRooms: Room[]
  activeReservations: Reservation[]
  staffId: string
}) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState(activeReservations)
  const [rooms, setRooms] = useState(availableRooms)
  const [step, setStep] = useState(1) // 1: guest info, 2: signature
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', id_type: 'National ID',
    id_number: '', nationality: 'Ghanaian', address: '',
    room_id: availableRooms[0]?.id ?? '', num_guests: '1',
    check_in_date: new Date().toISOString().split('T')[0],
    special_requests: '',
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const supabase = createClient()
  const router = useRouter()

  function getShift(): string {
    const h = new Date().getHours()
    if (h >= 6 && h < 14) return 'morning'
    if (h >= 14 && h < 22) return 'afternoon'
    return 'night'
  }

  // Signature canvas setup
  useEffect(() => {
    if (step === 2 && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')!
      ctx.strokeStyle = '#d4ab5a'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }, [step])

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    isDrawing.current = true
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function stopDraw() { isDrawing.current = false }

  function clearSignature() {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  async function handleCheckIn() {
    setLoading(true)
    setError('')

    const signatureData = canvasRef.current?.toDataURL() ?? ''
    const selectedRoom = rooms.find(r => r.id === form.room_id)

    try {
      // Create guest
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .insert({
          full_name: form.full_name, phone: form.phone, email: form.email,
          id_type: form.id_type, id_number: form.id_number,
          nationality: form.nationality, address: form.address,
        }).select().single()

      if (guestError) throw guestError

      // Create reservation
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .insert({
          guest_id: guest.id, room_id: form.room_id,
          check_in_date: form.check_in_date,
          num_guests: parseInt(form.num_guests),
          rate_at_checkin: selectedRoom?.rate,
          special_requests: form.special_requests,
          signature_data: signatureData,
          checked_in_by: staffId,
          status: 'checked_in',
        }).select().single()

      if (resError) throw resError

      // Update room status
      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id)

      setSuccess(`${form.full_name} checked in to Room ${selectedRoom?.room_number}`)
      setShowModal(false)
      setStep(1)
      setRooms(prev => prev.filter(r => r.id !== form.room_id))
      setReservations(prev => [{
        id: reservation.id, status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        num_guests: parseInt(form.num_guests),
        guests: { full_name: form.full_name, phone: form.phone, id_number: form.id_number },
        rooms: { room_number: selectedRoom?.room_number ?? '', category: selectedRoom?.category ?? '' },
      }, ...prev])
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message || 'Failed to check in guest')
    }
    setLoading(false)
  }

  async function handleCheckOut(reservationId: string) {
    const res = reservations.find(r => r.id === reservationId)
    if (!res) return

    // Get room id
    const { data: fullRes } = await supabase.from('reservations').select('room_id').eq('id', reservationId).single()
    if (!fullRes) return

    await supabase.from('reservations').update({ status: 'checked_out', checked_out_at: new Date().toISOString(), checked_out_by: staffId }).eq('id', reservationId)
    await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', fullRes.room_id)

    setReservations(prev => prev.filter(r => r.id !== reservationId))
    setSuccess(`${res.guests.full_name} checked out successfully`)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f4e4c1' }}>Guest Check-In</h2>
          <p style={{ fontSize: '13px', color: '#7a6e52', marginTop: '4px' }}>{reservations.length} guests currently checked in · {rooms.length} rooms available</p>
        </div>
        <button onClick={() => { setShowModal(true); setStep(1) }} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 20px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)',
          color: '#111008', fontWeight: 700, fontSize: '13px',
          border: 'none', borderRadius: '8px', cursor: 'pointer',
        }}>
          <UserPlus size={15} /> New Check-In
        </button>
      </div>

      {success && <div style={{ padding: '12px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', marginBottom: '20px' }}>✓ {success}</div>}

      {/* Active Reservations Table */}
      <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2b1e' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#c4b48a' }}>Currently Checked In</h3>
        </div>
        {reservations.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <UserPlus size={36} color="#3a3728" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#5c481f', fontSize: '14px' }}>No guests currently checked in</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#221f14' }}>
                {['Guest', 'Room', 'ID Number', 'Guests', 'Checked In', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5c481f', borderBottom: '1px solid #2e2b1e' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.id} style={{ borderBottom: '1px solid #2e2b1e' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#221f14')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4b48a' }}>{res.guests.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#5c481f' }}>{res.guests.phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '3px 10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#f87171' }}>
                      Room {res.rooms.room_number}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6e52' }}>{res.guests.id_number || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6e52' }}>{res.num_guests}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#5c481f' }}>
                    {new Date(res.checked_in_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => handleCheckOut(res.id)} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '5px 12px', background: 'rgba(212,171,90,0.1)',
                      border: '1px solid rgba(212,171,90,0.2)', borderRadius: '6px',
                      fontSize: '11px', fontWeight: 600, color: '#d4ab5a',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <LogOut size={11} /> Check Out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Check-In Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a1710', border: '1px solid #2e2b1e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: step === 2 ? '500px' : '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #d4ab5a, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f4e4c1' }}>
                  {step === 1 ? 'Guest Registration' : 'Guest Signature'}
                </h3>
                <p style={{ fontSize: '12px', color: '#7a6e52', marginTop: '4px' }}>
                  Step {step} of 2 — {step === 1 ? 'Fill guest details' : 'Guest signs below'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); setStep(1) }} style={{ background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6e52' }}>
                <X size={14} />
              </button>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px', marginBottom: '20px' }}>{error}</div>}

            {step === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LBL}>Full Name *</label>
                    <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Mensah" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                  <div>
                    <label style={LBL}>Phone</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0241234567" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LBL}>ID Type</label>
                    <select value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                      {['National ID', 'Passport', "Driver's License", 'Voter ID', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>ID Number</label>
                    <input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} placeholder="GHA-XXXXXXXXX" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LBL}>Nationality</label>
                    <input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="Ghanaian" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                  <div>
                    <label style={LBL}>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Optional" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                </div>
                <div>
                  <label style={LBL}>Address</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Home address" style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={LBL}>Room</label>
                    <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'}>
                      {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} - GH₵{r.rate}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LBL}>Guests</label>
                    <input type="number" min="1" value={form.num_guests} onChange={e => setForm(f => ({ ...f, num_guests: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                  <div>
                    <label style={LBL}>Check-in Date</label>
                    <input type="date" value={form.check_in_date} onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                  </div>
                </div>
                <div>
                  <label style={LBL}>Special Requests</label>
                  <textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))} placeholder="Any special requests..." rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#b8923d'} onBlur={e => e.target.style.borderColor = '#2e2b1e'} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" onClick={() => { setShowModal(false); setStep(1) }} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={() => { if (!form.full_name || !form.room_id) return; setStep(2) }} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Pen size={14} /> Next: Signature
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Guest summary */}
                <div style={{ padding: '16px', background: '#221f14', border: '1px solid #2e2b1e', borderRadius: '10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4b48a', marginBottom: '4px' }}>{form.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#7a6e52' }}>Room {rooms.find(r => r.id === form.room_id)?.room_number} · {form.num_guests} guest(s) · {form.check_in_date}</div>
                </div>

                <p style={{ fontSize: '13px', color: '#7a6e52', marginBottom: '12px' }}>
                  By signing below, the guest confirms they have read and agree to the hotel's terms and conditions.
                </p>

                {/* Signature canvas */}
                <div style={{ border: '1px solid #2e2b1e', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', background: '#0f0c07' }}>
                  <div style={{ padding: '8px 12px', background: '#221f14', borderBottom: '1px solid #2e2b1e', fontSize: '11px', color: '#5c481f', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Pen size={11} /> Guest Signature
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={450} height={180}
                    style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep(1)} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  <button onClick={clearSignature} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #2e2b1e', borderRadius: '8px', color: '#7a6e52', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RotateCcw size={13} /> Clear
                  </button>
                  <button onClick={handleCheckIn} disabled={loading} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #b8923d, #d4ab5a)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {loading ? 'Checking in...' : '✓ Confirm Check-In'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} } select option{background:#221f14;color:#f4e4c1} input::placeholder,textarea::placeholder{color:#3a3728}`}</style>
    </div>
  )
}
