'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, X, Pen, RotateCcw, LogOut, Search, User } from 'lucide-react'
import { sendNotification } from '@/lib/notify'

interface Room { id: string; room_number: string; category: string; rate: number }
interface Guest { id: string; full_name: string; phone: string; id_number: string; nationality: string; email: string; address: string; id_type: string }
interface Reservation {
  id: string; status: string; checked_in_at: string; num_guests: number
  guests: { full_name: string; phone: string; id_number: string }
  rooms: { room_number: string; category: string }
}

const INPUT = { width: '100%', padding: '10px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', color: '#f0d3a8', fontSize: '14px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7a6650', marginBottom: '6px' }

export default function CheckInContent({ availableRooms, activeReservations, staffId }: {
  availableRooms: Room[]; activeReservations: Reservation[]; staffId: string
}) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [reservations, setReservations] = useState(activeReservations)
  const [rooms, setRooms] = useState(availableRooms)
  const [step, setStep] = useState<'search' | 'form' | 'signature'>('search')
  const [idSearch, setIdSearch] = useState('')
  const [existingGuest, setExistingGuest] = useState<Guest | null>(null)
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

  useEffect(() => {
    if (step === 'signature' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')!
      ctx.strokeStyle = '#a8702e'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }, [step])

  async function searchGuest() {
    if (!idSearch.trim()) return
    setSearching(true)
    const { data } = await supabase.from('guests').select('*').eq('id_number', idSearch.trim()).single()
    if (data) {
      setExistingGuest(data)
      setForm(f => ({ ...f, full_name: data.full_name, phone: data.phone || '', email: data.email || '', id_type: data.id_type || 'National ID', id_number: data.id_number || '', nationality: data.nationality || 'Ghanaian', address: data.address || '' }))
    } else {
      setExistingGuest(null)
      setForm(f => ({ ...f, id_number: idSearch.trim() }))
    }
    setSearching(false)
    setStep('form')
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    isDrawing.current = true
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top
    ctx.beginPath(); ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top
    ctx.lineTo(x, y); ctx.stroke()
  }

  function stopDraw() { isDrawing.current = false }
  function clearSignature() {
    const canvas = canvasRef.current!
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
  }

  async function handleCheckIn() {
    setLoading(true); setError('')
    const signatureData = canvasRef.current?.toDataURL() ?? ''
    const selectedRoom = rooms.find(r => r.id === form.room_id)

    try {
      let guestId = existingGuest?.id

      if (!guestId) {
        const { data: guest, error: guestError } = await supabase.from('guests').insert({
          full_name: form.full_name, phone: form.phone, email: form.email,
          id_type: form.id_type, id_number: form.id_number,
          nationality: form.nationality, address: form.address,
        }).select().single()
        if (guestError) throw guestError
        guestId = guest.id
      } else {
        // Update existing guest info in case anything changed
        await supabase.from('guests').update({
          full_name: form.full_name, phone: form.phone, email: form.email,
          nationality: form.nationality, address: form.address,
        }).eq('id', guestId)
      }

      const { data: reservation, error: resError } = await supabase.from('reservations').insert({
        guest_id: guestId, room_id: form.room_id,
        check_in_date: form.check_in_date,
        num_guests: parseInt(form.num_guests),
        rate_at_checkin: selectedRoom?.rate,
        special_requests: form.special_requests,
        signature_data: signatureData,
        checked_in_by: staffId,
        status: 'checked_in',
      }).select().single()

      if (resError) throw resError

      await supabase.from('rooms').update({ status: 'occupied' }).eq('id', form.room_id)

      // Send notification
      await sendNotification({
        title: 'Guest Checked In',
        message: `${form.full_name} checked in to Room ${selectedRoom?.room_number}`,
        entity_type: 'check_in',
        entity_id: reservation.id,
      })

      setSuccess(`${form.full_name} checked in to Room ${selectedRoom?.room_number}${existingGuest ? ' (returning guest)' : ''}`)
      setShowModal(false); setStep('search'); setIdSearch(''); setExistingGuest(null)
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
    const { data: fullRes } = await supabase.from('reservations').select('room_id').eq('id', reservationId).single()
    if (!fullRes) return
    await supabase.from('reservations').update({ status: 'checked_out', checked_out_at: new Date().toISOString(), checked_out_by: staffId }).eq('id', reservationId)
    await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', fullRes.room_id)
    setReservations(prev => prev.filter(r => r.id !== reservationId))

    // Send notification
    await sendNotification({
      title: 'Guest Checked Out',
      message: `${res.guests.full_name} checked out from Room ${res.rooms.room_number}`,
      entity_type: 'check_out',
      entity_id: reservationId,
    })

    setSuccess(`${res.guests.full_name} checked out successfully`)
    setTimeout(() => setSuccess(''), 4000)
  }

  function resetModal() { setShowModal(false); setStep('search'); setIdSearch(''); setExistingGuest(null); setError('') }

  return (
    <div className="dashboard-page" style={{ padding: '32px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontWeight: 600, color: '#f0d3a8' }}>Guest Check-In</h2>
          <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '4px' }}>{reservations.length} guests in · {rooms.length} rooms available</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          <UserPlus size={15} /> New Check-In
        </button>
      </div>

      {success && <div style={{ padding: '12px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', color: '#4ade80', fontSize: '13px', marginBottom: '20px' }}>✓ {success}</div>}

      {/* Active Reservations */}
      <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2010' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#c4ab85' }}>Currently Checked In</h3>
        </div>
        {reservations.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}><UserPlus size={36} color="#3a3220" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#7a6650' }}>No guests currently checked in</p></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead><tr style={{ background: '#221b10' }}>
              {['Guest', 'Room', 'ID Number', 'Guests', 'Checked In', 'Action'].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6650', borderBottom: '1px solid #2e2010' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {reservations.map(res => (
                <tr key={res.id} style={{ borderBottom: '1px solid #2e2010' }} onMouseEnter={e => (e.currentTarget.style.background = '#221b10')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4ab85' }}>{res.guests.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#7a6650' }}>{res.guests.phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '100px', fontSize: '12px', fontWeight: 600, color: '#f87171' }}>Room {res.rooms.room_number}</span></td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>{res.guests.id_number || '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>{res.num_guests}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#7a6650' }}>{new Date(res.checked_in_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => handleCheckOut(res.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', borderRadius: '6px', fontSize: '11px', fontWeight: 600, color: '#a8702e', cursor: 'pointer', fontFamily: 'inherit' }}>
                      <LogOut size={11} /> Check Out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#1a160c', border: '1px solid #2e2010', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #a8702e, transparent)', marginBottom: '16px', borderRadius: '2px' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontWeight: 600, color: '#f0d3a8' }}>
                  {step === 'search' ? 'Search Guest by ID' : step === 'form' ? 'Guest Details' : 'Guest Signature'}
                </h3>
                <p style={{ fontSize: '12px', color: '#7a6650', marginTop: '4px' }}>
                  Step {step === 'search' ? 1 : step === 'form' ? 2 : 3} of 3
                </p>
              </div>
              <button onClick={resetModal} style={{ background: '#221b10', border: '1px solid #2e2010', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#7a6650' }}><X size={14} /></button>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px', marginBottom: '20px' }}>{error}</div>}

            {/* Step 1: ID Search */}
            {step === 'search' && (
              <div>
                <p style={{ fontSize: '13px', color: '#7a6650', marginBottom: '20px', lineHeight: 1.6 }}>
                  Scan or type the guest's ID number to check if they're a returning guest.
                </p>
                <div>
                  <label style={LBL}>ID Number</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      value={idSearch} onChange={e => setIdSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchGuest()}
                      placeholder="GHA-XXXXXXXXX-X" autoFocus
                      style={{ ...INPUT, flex: 1 }}
                      onFocus={e => e.target.style.borderColor = '#93602a'}
                      onBlur={e => e.target.style.borderColor = '#2e2010'}
                    />
                    <button onClick={searchGuest} disabled={searching} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                      <Search size={14} /> {searching ? '...' : 'Search'}
                    </button>
                  </div>
                </div>
                <button onClick={() => { setExistingGuest(null); setStep('form') }} style={{ marginTop: '16px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Skip — New Guest (No ID)
                </button>
              </div>
            )}

            {/* Step 2: Guest Form */}
            {step === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {existingGuest && (
                  <div style={{ padding: '12px 16px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={16} color="#4ade80" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#4ade80' }}>Returning Guest Found</div>
                      <div style={{ fontSize: '11px', color: '#7a6650' }}>Details pre-filled. Update if anything has changed.</div>
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Full Name *</label><input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Mensah" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                  <div><label style={LBL}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0241234567" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>ID Type</label>
                    <select value={form.id_type} onChange={e => setForm(f => ({ ...f, id_type: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>
                      {['National ID', 'Passport', "Driver's License", 'Voter ID', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>ID Number</label><input value={form.id_number} onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))} placeholder="GHA-XXXXXXXXX" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Nationality</label><input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="Ghanaian" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                  <div><label style={LBL}>Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="Optional" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                </div>
                <div><label style={LBL}>Address</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Home address" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div><label style={LBL}>Room</label>
                    <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} style={{ ...INPUT, appearance: 'none' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'}>
                      {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} — GH₵{r.rate}</option>)}
                    </select>
                  </div>
                  <div><label style={LBL}>Guests</label><input type="number" min="1" value={form.num_guests} onChange={e => setForm(f => ({ ...f, num_guests: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                  <div><label style={LBL}>Check-in Date</label><input type="date" value={form.check_in_date} onChange={e => setForm(f => ({ ...f, check_in_date: e.target.value }))} style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                </div>
                <div><label style={LBL}>Special Requests</label><textarea value={form.special_requests} onChange={e => setForm(f => ({ ...f, special_requests: e.target.value }))} placeholder="Any special requests..." rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button onClick={() => setStep('search')} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  <button onClick={() => { if (!form.full_name || !form.room_id) return; setStep('signature') }} style={{ flex: 2, padding: '11px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Pen size={14} /> Next: Signature
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Signature */}
            {step === 'signature' && (
              <div>
                <div style={{ padding: '16px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#c4ab85', marginBottom: '4px' }}>{form.full_name}</div>
                  <div style={{ fontSize: '12px', color: '#7a6650' }}>Room {rooms.find(r => r.id === form.room_id)?.room_number} · {form.num_guests} guest(s) · {form.check_in_date}</div>
                </div>
                <p style={{ fontSize: '13px', color: '#7a6650', marginBottom: '12px' }}>Guest signs below to confirm they agree to the hotel's terms and conditions.</p>
                <div style={{ border: '1px solid #2e2010', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', background: '#0f0c07' }}>
                  <div style={{ padding: '8px 12px', background: '#221b10', borderBottom: '1px solid #2e2010', fontSize: '11px', color: '#7a6650', display: 'flex', alignItems: 'center', gap: '6px' }}><Pen size={11} /> Guest Signature</div>
                  <canvas ref={canvasRef} width={450} height={180} style={{ display: 'block', cursor: 'crosshair', touchAction: 'none', width: '100%' }}
                    onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                    onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setStep('form')} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
                  <button onClick={clearSignature} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}><RotateCcw size={13} /> Clear</button>
                  <button onClick={handleCheckIn} disabled={loading} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #93602a, #a8702e)', color: '#111008', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {loading ? 'Checking in...' : '✓ Confirm Check-In'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} select option{background:#221b10;color:#f0d3a8} input::placeholder,textarea::placeholder{color:#3a3220}`}</style>
    </div>
  )
}
