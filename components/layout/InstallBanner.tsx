'use client'

import { useState, useEffect } from 'react'
import { Share, X, Smartphone } from 'lucide-react'

const STORAGE_KEY = 'homs_install_banner_dismissed'

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
}

export default function InstallBanner() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(null)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed || isStandalone()) return

    const isMobile = /Mobi|Android/i.test(navigator.userAgent) || isIOS()
    if (!isMobile) return

    setPlatform(isIOS() ? 'ios' : 'android')
    const timer = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  if (!show || !platform) return null

  return (
    <div style={{
      position: 'fixed', bottom: '76px', left: '12px', right: '12px',
      zIndex: 70, background: '#1a160c', border: '1px solid #2e2010',
      borderRadius: '14px', padding: '16px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.3s ease',
    }}>
      <button onClick={dismiss} style={{
        position: 'absolute', top: '10px', right: '10px',
        width: '24px', height: '24px', background: '#221b10',
        border: '1px solid #2e2010', borderRadius: '6px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#7a6650', cursor: 'pointer',
      }}>
        <X size={12} />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingRight: '20px' }}>
        <div style={{ width: '36px', height: '36px', background: 'rgba(168,112,46,0.12)', border: '1px solid rgba(168,112,46,0.25)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Smartphone size={17} color="#a8702e" />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0d3a8', marginBottom: '4px' }}>
            Add Kayla City to your home screen
          </div>
          {platform === 'ios' ? (
            <p style={{ fontSize: '12px', color: '#c4ab85', lineHeight: 1.5 }}>
              Tap the <Share size={11} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> Share button below, then scroll down and tap <strong style={{ color: '#a8702e' }}>"Add to Home Screen"</strong>.
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#c4ab85', lineHeight: 1.5 }}>
              Tap the menu (⋮) in your browser, then tap <strong style={{ color: '#a8702e' }}>"Add to Home Screen"</strong> or <strong style={{ color: '#a8702e' }}>"Install App"</strong>.
            </p>
          )}
        </div>
      </div>

      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
