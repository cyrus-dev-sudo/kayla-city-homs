'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Coffee, Check, Clock } from 'lucide-react'

const supabase = createClient()

function isWithinBookingWindow(): boolean {
  const hour = new Date().getHours()
  return hour >= 18 && hour < 22
}

const INPUT = { width: '100%', padding: '12px 14px', background: '#221b10', border: '1px solid #2e2010', borderRadius: '10px', color: '#f0d3a8', fontSize: '15px', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties
const LBL = { display: 'block', fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#7a6650', marginBottom: '8px' }

const OptionButton = ({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) => (
  <button type="button" onClick={onClick} style={{
    padding: '12px 16px', borderRadius: '10px',
    border: `1px solid ${selected ? '#a8702e' : '#2e2010'}`,
    background: selected ? 'rgba(212,171,90,0.12)' : '#221b10',
    color: selected ? '#a8702e' : '#7a6650',
    fontSize: '14px', fontWeight: selected ? 600 : 400,
    cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    transition: 'all 0.15s', width: '100%', textAlign: 'left',
  }}>
    {label}
    {selected && <Check size={15} />}
  </button>
)

function BrandHeader() {
  return (
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <div style={{ width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', filter: 'drop-shadow(0 8px 20px rgba(168,112,46,0.25))' }}>
        <Image src="/icons/logo-source.png" alt="Kayla City" width={72} height={72} style={{ objectFit: 'contain' }} priority />
      </div>
      <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: 600, color: '#f0d3a8', marginBottom: '4px' }}>Kayla City ApartHotel</h1>
      <p style={{ fontSize: '11px', color: '#7a6650', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>Breakfast Booking</p>
    </div>
  )
}

const pageWrapStyle: React.CSSProperties = { minHeight: '100vh', background: '#111008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }
const cardStyle: React.CSSProperties = { width: '100%', maxWidth: '440px', background: '#1a160c', border: '1px solid #2e2010', borderRadius: '20px', padding: '32px' }

export default function BreakfastBookingPage() {
  const [windowOpen, setWindowOpen] = useState(isWithinBookingWindow())
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    room_number: '', guest_name: '', beverage: '', bread: '', egg: '',
    baked_beans: false, sausage: false, sugar: false, milk: false, special_notes: '',
  })

  useEffect(() => {
    const interval = setInterval(() => setWindowOpen(isWithinBookingWindow()), 60000)
    return () => clearInterval(interval)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: insertError } = await supabase.from('breakfast_requests').insert({
      room_number: form.room_number, guest_name: form.guest_name,
      beverage: form.beverage || null, bread: form.bread || null, egg: form.egg || null,
      baked_beans: form.baked_beans, sausage: form.sausage, sugar: form.sugar, milk: form.milk,
      special_notes: form.special_notes || null,
    })
    if (insertError) { setError('Something went wrong. Please ask reception for help.'); setLoading(false); return }
    setSubmitted(true)
    setLoading(false)
  }

  if (!windowOpen && !submitted) {
    return (
      <div style={pageWrapStyle}>
        <div style={cardStyle}>
          <BrandHeader />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(212,171,90,0.1)', border: '1px solid rgba(212,171,90,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Clock size={26} color="#a8702e" />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: 600, color: '#f0d3a8', marginBottom: '10px' }}>Breakfast Booking Closed</h2>
            <p style={{ fontSize: '14px', color: '#7a6650', lineHeight: 1.6 }}>Breakfast orders can be booked daily between <strong style={{ color: '#a8702e' }}>6:00 PM and 10:00 PM</strong> for the next morning.</p>
            <p style={{ fontSize: '13px', color: '#7a6650', marginTop: '16px' }}>Please come back this evening, or speak to reception for assistance.</p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={pageWrapStyle}>
        <div style={cardStyle}>
          <BrandHeader />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={26} color="#4ade80" />
            </div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '22px', fontWeight: 600, color: '#f0d3a8', marginBottom: '10px' }}>Breakfast Request Received</h2>
            <p style={{ fontSize: '14px', color: '#7a6650', lineHeight: 1.6 }}>
              Thank you, <strong style={{ color: '#a8702e' }}>{form.guest_name}</strong>. Your breakfast will be prepared for <strong style={{ color: '#a8702e' }}>Room {form.room_number}</strong> and served between <strong style={{ color: '#a8702e' }}>8:00–10:00 AM</strong>.
            </p>
            <button onClick={() => { setSubmitted(false); setForm({ room_number: '', guest_name: '', beverage: '', bread: '', egg: '', baked_beans: false, sausage: false, sugar: false, milk: false, special_notes: '' }) }} style={{ marginTop: '24px', padding: '10px 24px', background: 'transparent', border: '1px solid #2e2010', borderRadius: '8px', color: '#7a6650', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={pageWrapStyle}>
      <div style={cardStyle}>
        <BrandHeader />
        <p style={{ fontSize: '13px', color: '#7a6650', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
          Tell us what you'd like for breakfast tomorrow morning, served <strong style={{ color: '#a8702e' }}>8:00–10:00 AM</strong>. Free of charge.
        </p>
        {error && <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', color: '#f87171', fontSize: '13px', marginBottom: '20px' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={LBL}>Room Number *</label><input required value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} placeholder="101" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
            <div><label style={LBL}>Your Name *</label><input required value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} placeholder="John Doe" style={INPUT} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} /></div>
          </div>

          <div>
            <label style={LBL}>Beverage</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Milo', 'Nescafé', 'Tea bag', 'Oats', 'Hausa Kooko'].map(b => (
                <OptionButton key={b} label={b} selected={form.beverage === b} onClick={() => setForm(f => ({ ...f, beverage: f.beverage === b ? '' : b }))} />
              ))}
            </div>
          </div>

          <div>
            <label style={LBL}>Bread</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Plain bread', 'Toasted bread', 'Toasted with butter'].map(b => (
                <OptionButton key={b} label={b} selected={form.bread === b} onClick={() => setForm(f => ({ ...f, bread: f.bread === b ? '' : b }))} />
              ))}
            </div>
          </div>

          <div>
            <label style={LBL}>Egg</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Omelette', 'Boiled egg'].map(eg => (
                <OptionButton key={eg} label={eg} selected={form.egg === eg} onClick={() => setForm(f => ({ ...f, egg: f.egg === eg ? '' : eg }))} />
              ))}
            </div>
          </div>

          <div>
            <label style={LBL}>Add-ons</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {([['baked_beans', 'Baked Beans'], ['sausage', 'Sausage'], ['sugar', 'Sugar'], ['milk', 'Milk']] as const).map(([key, label]) => (
                <OptionButton key={key} label={label} selected={form[key]} onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))} />
              ))}
            </div>
          </div>

          <div>
            <label style={LBL}>Special Requests (optional)</label>
            <textarea value={form.special_notes} onChange={e => setForm(f => ({ ...f, special_notes: e.target.value }))} placeholder="Any allergies or special requests..." rows={2} style={{ ...INPUT, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#93602a'} onBlur={e => e.target.style.borderColor = '#2e2010'} />
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '14px', marginTop: '8px',
            background: loading ? '#3d3016' : 'linear-gradient(135deg, #93602a, #a8702e)',
            color: loading ? '#7a6650' : '#111008', fontWeight: 700, fontSize: '14px',
            letterSpacing: '0.03em', border: 'none', borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <Coffee size={16} /> {loading ? 'Submitting...' : 'Submit Breakfast Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
