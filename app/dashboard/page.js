'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const THR_VALS = [1.5, 1.3, 1.1, null]
const ALERT_DEF = [
  { id: 'a1', warn: true,  time: '14 Jun 2026 · 09:42', meta: 'ZEST · Health: 1.14', body: 'sBTC dropped 4.2% in 2h — collateral value fell from $8,420 to $7,880. Suggested: add collateral.' },
  { id: 'a2', warn: false, time: '13 Jun 2026 · 22:11', meta: 'ZEST · Health: 1.38', body: 'Health recovered. sBTC price stabilized.' },
  { id: 'a3', warn: true,  time: '12 Jun 2026 · 14:05', meta: 'ZEST · Health: 1.09', body: 'Critical: health approaching liquidation. Borrow rate increased 0.8%. Act immediately.' },
]

function hfColor(hf) { return hf >= 1.5 ? '#22C55E' : hf >= 1.1 ? '#EAB308' : '#EF4444' }

export default function Dashboard() {
  const SAMPLE_WALLET = 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNZ9V8F4K'

  const [wallet,         setWallet]         = useState(SAMPLE_WALLET)
  const [inputVal,       setInputVal]       = useState('')
  const [loading,        setLoading]        = useState(false)
  const [activeNav,      setActiveNav]      = useState('overview')
  const [sync,           setSync]           = useState(12)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [thresholds,     setThresholds]     = useState({ z1: 1.3, z2: 1.3 })
  const [dismissed,      setDismissed]      = useState([])
  const [isMobile,       setIsMobile]       = useState(false)

  // sync ticker
  useEffect(() => {
    const t = setInterval(() => setSync(s => s >= 30 ? 1 : s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // responsive
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // outside-click closes dropdown
  useEffect(() => {
    if (!openDropdownId) return
    const h = (e) => { if (!e.target.closest('[data-dd]')) setOpenDropdownId(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [openDropdownId])

  const hasWallet = !!wallet
  const noWallet  = !wallet
  const walletShort = wallet ? wallet.slice(0, 6) + '…' + wallet.slice(-4) : ''

  const startMonitoring = () => {
    const v = inputVal.trim()
    if (!v || loading) return
    setLoading(true)
    setTimeout(() => { setWallet(v); setLoading(false); setInputVal('') }, 850)
  }
  const clearWallet = () => { setWallet(null); setOpenDropdownId(null) }
  const focusInput  = () => document.getElementById('son-wallet-input')?.focus()

  // ── layout ──
  const sidebarStyle = isMobile ? {
    position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, height: '60px',
    background: '#111', display: 'flex', flexDirection: 'row', alignItems: 'stretch',
    borderTop: '1px solid rgba(255,255,255,.12)',
  } : {
    position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
    background: '#111', display: 'flex', flexDirection: 'column', zIndex: 30,
  }
  const mainStyle = {
    marginLeft: isMobile ? 0 : '220px',
    marginBottom: isMobile ? '60px' : 0,
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
  }

  // ── nav ──
  const NAV_DEF = [
    { key: 'overview',   label: 'OVERVIEW' },
    { key: 'positions',  label: 'POSITIONS' },
    { key: 'alerts',     label: 'ALERT HISTORY' },
    { key: 'settings',   label: 'SETTINGS', soon: true },
  ]

  // ── positions ──
  const POS_DEF = [
    { id: 'z1', protocol: 'ZEST PROTOCOL', hf: 1.42, collateral: '0.42 sBTC', borrowed: '$2,840', liqPrice: '$58,200', note: `Last updated: ${sync}s ago`, warn: false },
    { id: 'z2', protocol: 'ZEST PROTOCOL', hf: 1.14, collateral: '0.18 sBTC', borrowed: '$1,200', liqPrice: '$61,400', note: '⚠ sBTC down 4.2% in last 2h', warn: true },
  ]
  const lowestHf = Math.min(...POS_DEF.map(p => p.hf))
  const showPositions = activeNav === 'overview' || activeNav === 'positions'
  const showAlerts    = activeNav === 'overview' || activeNav === 'alerts'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0EFEB', color: '#0D0D0D', fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside style={sidebarStyle}>
        {!isMobile && (
          <div style={{ padding: '22px 22px 0' }}>
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', textDecoration: 'none' }}>
              <span style={{ display: 'inline-flex', background: '#fff', borderRadius: '50%', width: '28px', height: '28px', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                <Image src="/sonar-logo.png" alt="Sonar" width={28} height={28} style={{ display: 'block' }} />
              </span>
              <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '17px', letterSpacing: '.22em' }}>SONAR</span>
            </a>
            <div style={{ height: '1px', background: 'rgba(255,255,255,.14)', margin: '20px 0 0' }} />
          </div>
        )}

        <nav style={{ padding: isMobile ? 0 : '18px 12px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 0 : '2px', flex: 1, alignItems: isMobile ? 'stretch' : undefined }}>
          {NAV_DEF.map(n => {
            const active   = activeNav === n.key
            const disabled = !!n.soon
            const btnStyle = isMobile ? {
              flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: 'none', border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              padding: '6px 2px',
              fontFamily: "'Space Mono'", fontSize: '8.5px', letterSpacing: '.06em',
              color: active ? '#fff' : disabled ? '#55554f' : '#9a9a96',
            } : {
              display: 'flex', alignItems: 'center', gap: '11px',
              width: '100%', textAlign: 'left',
              background: 'none',
              border: 'none',
              borderLeft: `3px solid ${active ? '#FF5C00' : 'transparent'}`,
              cursor: disabled ? 'default' : 'pointer',
              padding: '11px 13px', borderRadius: '0 3px 3px 0',
              fontFamily: "'Space Mono'", fontSize: '11.5px', letterSpacing: '.08em',
              color: active ? '#FF5C00' : disabled ? '#55554f' : '#a6a6a2',
              transition: 'color .15s ease,background .15s ease',
            }
            return (
              <button
                key={n.key}
                className={disabled ? undefined : 'son-nav-btn'}
                data-disabled={disabled ? 'true' : undefined}
                onClick={disabled ? undefined : () => setActiveNav(n.key)}
                style={btnStyle}
              >
                <span style={{ fontSize: '9px', color: active ? '#FF5C00' : disabled ? '#55554f' : '#7a7a76' }}>{active ? '●' : '○'}</span>
                <span>{n.label}</span>
                {n.soon && !isMobile && (
                  <span style={{ marginLeft: 'auto', fontSize: '8.5px', letterSpacing: '.1em', color: '#5c5c58', border: '1px solid #3a3a38', padding: '2px 5px', borderRadius: '2px' }}>SOON</span>
                )}
              </button>
            )
          })}
        </nav>

        {!isMobile && (
          <div style={{ padding: '18px 22px 22px', borderTop: '1px solid rgba(255,255,255,.14)' }}>
            <div style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.16em', color: '#6c6c68', marginBottom: '12px' }}>STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Space Mono'", fontSize: '11.5px', color: '#e6e6e2', marginBottom: '6px' }}>
              <span style={{ width: '7px', height: '7px', background: '#EAB308', borderRadius: '50%' }} />IN DEVELOPMENT
            </div>
            <div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', color: '#8c8c88', marginBottom: '18px' }}>Last sync: {sync}s ago</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: "'Space Mono'", fontSize: '11px', color: '#b6b6b2' }}>
              <a href="https://x.com/sonaragent_" target="_blank" rel="noopener noreferrer" className="son-sidebar-link" style={{ color: '#b6b6b2', textDecoration: 'none' }}>X / Twitter ↗</a>
              <a href="#" className="son-sidebar-link" style={{ color: '#b6b6b2', textDecoration: 'none' }}>Telegram ↗</a>
            </div>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div style={mainStyle}>

        {/* TOP BAR */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(240,239,235,.9)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,.1)', padding: '16px clamp(20px,4vw,36px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', letterSpacing: '.2em', color: '#8a8a85' }}>DASHBOARD</div>
          {hasWallet && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(0,0,0,.18)', background: '#FAFAF7', padding: '7px 8px 7px 14px', borderRadius: '3px' }}>
              <span style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%' }} />
              <span style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', letterSpacing: '.02em' }}>{walletShort}</span>
              <button className="son-clear-btn" onClick={clearWallet} aria-label="Clear wallet" style={{ width: '22px', height: '22px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'rgba(0,0,0,.06)', color: '#555', borderRadius: '2px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
            </div>
          )}
          {noWallet && (
            <button className="son-add-wallet-btn" onClick={focusInput} style={{ fontFamily: "'Space Mono'", fontSize: '11.5px', letterSpacing: '.04em', border: '1px solid #FF5C00', color: '#FF5C00', background: 'none', padding: '9px 15px', borderRadius: '3px', cursor: 'pointer' }}>+ Add Wallet Address</button>
          )}
        </div>

        {/* ── STATE A: EMPTY ── */}
        {noWallet && (
          <div style={{ padding: 'clamp(40px,7vw,90px) clamp(20px,4vw,36px)', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '520px', background: '#FAFAF7', border: '1px solid rgba(0,0,0,.14)', padding: 'clamp(28px,4vw,44px)' }}>
              <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '16px', height: '16px', borderTop: '2px solid #FF5C00', borderLeft: '2px solid #FF5C00' }} />
              <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '16px', height: '16px', borderTop: '2px solid #FF5C00', borderRight: '2px solid #FF5C00' }} />
              <span style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '16px', height: '16px', borderBottom: '2px solid #FF5C00', borderLeft: '2px solid #FF5C00' }} />
              <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '16px', height: '16px', borderBottom: '2px solid #FF5C00', borderRight: '2px solid #FF5C00' }} />
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '24px', letterSpacing: '.2em', marginBottom: '14px' }}>SONAR</div>
              <div style={{ height: '1px', background: 'rgba(0,0,0,.12)', marginBottom: '18px' }} />
              <p style={{ fontSize: '16px', lineHeight: 1.55, color: '#3a3a37', marginBottom: '26px', maxWidth: '380px' }}>Enter a Stacks wallet address to start monitoring your lending positions.</p>
              <input
                id="son-wallet-input"
                className="son-wallet-input"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') startMonitoring() }}
                placeholder="SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNZ9V8F4K…"
                spellCheck={false}
                style={{ width: '100%', fontFamily: "'Space Mono', monospace", fontSize: '13.5px', letterSpacing: '.01em', padding: '15px 16px', border: '1px solid rgba(0,0,0,.2)', background: '#fff', borderRadius: '3px', marginBottom: '12px', color: '#0D0D0D', transition: 'border-color .15s ease' }}
              />
              <button
                className="son-start-btn"
                onClick={startMonitoring}
                disabled={loading}
                style={{ width: '100%', border: 'none', background: '#FF5C00', color: '#fff', fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '15px', padding: '15px', borderRadius: '3px', cursor: loading ? 'default' : 'pointer', opacity: loading ? .85 : 1 }}
              >
                {loading
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}><span style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'son-spin .7s linear infinite', display: 'inline-block' }} />SYNCING…</span>
                  : <span>→ Start Monitoring</span>}
              </button>
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#6a6a66' }}><span style={{ color: '#FF5C00', fontSize: '9px', marginTop: '5px' }}>○</span>No wallet connection needed.</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: '#6a6a66' }}><span style={{ color: '#FF5C00', fontSize: '9px', marginTop: '5px' }}>○</span>Read-only. Your funds stay in your wallet.</div>
              </div>
            </div>
          </div>
        )}

        {/* ── STATE B: DASHBOARD ── */}
        {hasWallet && (
          <div style={{ padding: 'clamp(22px,3.5vw,34px) clamp(20px,4vw,36px) 60px' }}>

            {/* B1 SUMMARY BAR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', border: '1px solid rgba(0,0,0,.12)', background: '#E9E7E0', marginBottom: '34px' }}>
              <div style={{ padding: '22px clamp(16px,2.5vw,26px)', borderRight: '1px solid rgba(0,0,0,.1)' }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '32px', lineHeight: 1 }}>2</div>
                <div style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '7px' }}>POSITIONS MONITORED</div>
              </div>
              <div style={{ padding: '22px clamp(16px,2.5vw,26px)', borderRight: '1px solid rgba(0,0,0,.1)' }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '32px', lineHeight: 1, color: hfColor(lowestHf) }}>{lowestHf.toFixed(2)}</div>
                <div style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '7px' }}>LOWEST HEALTH FACTOR</div>
              </div>
              <div style={{ padding: '22px clamp(16px,2.5vw,26px)', borderRight: '1px solid rgba(0,0,0,.1)' }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '32px', lineHeight: 1 }}>3</div>
                <div style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '7px' }}>ALERTS TODAY</div>
              </div>
              <div style={{ padding: '22px clamp(16px,2.5vw,26px)' }}>
                <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '32px', lineHeight: 1 }}>$12,840</div>
                <div style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '7px' }}>TOTAL COLLATERAL (sBTC EQ.)</div>
              </div>
            </div>

            {/* B2 POSITIONS */}
            {showPositions && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: '13px', letterSpacing: '.16em', color: '#0D0D0D' }}>POSITIONS</div>
                  <button className="son-add-position-btn" style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.04em', border: '1px solid #FF5C00', color: '#FF5C00', background: 'none', padding: '8px 13px', borderRadius: '3px', cursor: 'pointer' }}>+ Add Position</button>
                </div>
                <div style={{ height: '1px', background: 'rgba(0,0,0,.14)', marginBottom: '22px' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: '18px', marginBottom: '40px' }}>
                  {POS_DEF.map(p => {
                    const color = hfColor(p.hf)
                    const fill  = Math.max(0, Math.min(1, (p.hf - 1.0) / 1.0))
                    const arcOffset = Math.round(100 * (1 - fill))
                    const open  = openDropdownId === p.id
                    const sel   = thresholds[p.id]
                    return (
                      <div key={p.id} style={{ position: 'relative', background: '#FAFAF7', border: p.warn ? '1.5px solid rgba(255,92,0,.55)' : '1px solid rgba(0,0,0,.14)', display: 'flex', flexDirection: 'column' }}>
                        <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '13px', height: '13px', borderTop: '1.5px solid rgba(0,0,0,.4)', borderLeft: '1.5px solid rgba(0,0,0,.4)' }} />
                        <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '13px', height: '13px', borderBottom: '1.5px solid rgba(0,0,0,.4)', borderRight: '1.5px solid rgba(0,0,0,.4)' }} />

                        {/* card header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '18px 20px 14px' }}>
                          <span style={{ fontFamily: "'Space Mono'", fontSize: '12px', letterSpacing: '.08em', fontWeight: 700 }}>{p.protocol}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.08em', color: p.warn ? '#FF5C00' : '#1a8a40' }}>
                            <span style={{ fontSize: '8px' }}>{p.warn ? '⚠' : '●'}</span>
                            {p.warn ? 'WARNING' : 'LIVE'}
                          </span>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(0,0,0,.1)', margin: '0 20px' }} />

                        {/* gauge */}
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 6px' }}>
                          <div style={{ position: 'relative', width: '130px', height: '106px' }}>
                            <svg viewBox="0 0 164 134" style={{ width: '100%', height: '100%', display: 'block' }}>
                              <path d="M41,117 A58 58 0 1 1 123,117" fill="none" stroke="#E1DFD8" strokeWidth="11" strokeLinecap="round" />
                              <path d="M41,117 A58 58 0 1 1 123,117" pathLength="100" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray="100" strokeDashoffset={arcOffset} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '12px', pointerEvents: 'none' }}>
                              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: '22px', lineHeight: 1, color }}>{p.hf.toFixed(2)}</div>
                              <div style={{ fontFamily: "'Space Mono'", fontSize: '8px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '5px' }}>HEALTH FACTOR</div>
                            </div>
                          </div>
                        </div>

                        {/* stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', padding: '8px 20px 0' }}>
                          <div><div style={{ fontFamily: "'Space Mono'", fontSize: '9px', letterSpacing: '.08em', color: '#a0a09a', marginBottom: '5px' }}>COLLATERAL</div><div style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', fontWeight: 700 }}>{p.collateral}</div></div>
                          <div><div style={{ fontFamily: "'Space Mono'", fontSize: '9px', letterSpacing: '.08em', color: '#a0a09a', marginBottom: '5px' }}>BORROWED</div><div style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', fontWeight: 700 }}>{p.borrowed}</div></div>
                          <div><div style={{ fontFamily: "'Space Mono'", fontSize: '9px', letterSpacing: '.08em', color: '#a0a09a', marginBottom: '5px' }}>LIQ. PRICE</div><div style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', fontWeight: 700 }}>{p.liqPrice}</div></div>
                        </div>

                        <div style={{ height: '1px', background: 'rgba(0,0,0,.1)', margin: '18px 20px 0' }} />
                        <div style={{ padding: '13px 20px 0', fontFamily: "'Space Mono'", fontSize: '11px', color: p.warn ? '#FF5C00' : '#8a8a85' }}>{p.note}</div>

                        {/* actions + dropdown */}
                        <div data-dd="1" style={{ position: 'relative', display: 'flex', gap: '10px', padding: '16px 20px 20px' }}>
                          <a href="#" className="son-pos-btn-outline" style={{ flex: 1, textAlign: 'center', border: '1px solid rgba(0,0,0,.8)', color: '#0D0D0D', fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.02em', padding: '10px 12px', borderRadius: '3px', display: 'block' }}>→ Open in Zest ↗</a>
                          <button
                            className="son-pos-btn-alert"
                            onClick={() => setOpenDropdownId(id => id === p.id ? null : p.id)}
                            style={{ flex: 1, border: 'none', background: '#FF5C00', color: '#fff', fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.02em', padding: '10px 12px', borderRadius: '3px', cursor: 'pointer' }}
                          >Set Alert ▾</button>

                          {open && (
                            <div style={{ position: 'absolute', right: '20px', bottom: '62px', zIndex: 10, width: '208px', background: '#fff', border: '1px solid rgba(0,0,0,.18)', borderRadius: '3px', boxShadow: '0 12px 30px rgba(0,0,0,.14)', overflow: 'hidden' }}>
                              {THR_VALS.map((v, j) => {
                                const isSel = v != null && Math.abs(sel - v) < 0.001
                                return (
                                  <button
                                    key={j}
                                    className="son-threshold-opt"
                                    onClick={() => {
                                      setThresholds(st => ({ ...st, [p.id]: v != null ? v : st[p.id] }))
                                      setOpenDropdownId(null)
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid rgba(0,0,0,.08)', cursor: 'pointer', padding: '11px 14px', fontFamily: "'Space Mono'", fontSize: '12px', color: isSel ? '#0D0D0D' : '#555' }}
                                  >
                                    <span>{v == null ? 'Custom threshold…' : `Alert when HF < ${v.toFixed(1)}`}</span>
                                    {isSel && <span style={{ color: '#FF5C00' }}>✓</span>}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* B3 ALERT HISTORY */}
            {showAlerts && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: '13px', letterSpacing: '.16em', color: '#0D0D0D' }}>ALERT HISTORY</div>
                  <button className="son-view-all-btn" style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.04em', border: 'none', background: 'none', color: '#555', cursor: 'pointer' }}>View All →</button>
                </div>
                <div style={{ height: '1px', background: 'rgba(0,0,0,.14)', marginBottom: '18px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ALERT_DEF.filter(a => !dismissed.includes(a.id)).map((a, i) => (
                    <div key={a.id} style={{ background: i % 2 ? '#FAFAF7' : '#fff', border: '1px solid rgba(0,0,0,.12)', borderLeft: `3px solid ${a.warn ? '#FF5C00' : 'rgba(0,0,0,.25)'}`, borderRadius: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px' }}>
                        <span style={{ fontSize: '14px', lineHeight: 1.4, color: a.warn ? '#FF5C00' : '#8a8a85' }}>{a.warn ? '⚠' : '●'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '7px' }}>
                            <span style={{ fontFamily: "'Space Mono'", fontSize: '11px', color: '#8a8a85', letterSpacing: '.04em' }}>{a.time}</span>
                            <span style={{ fontFamily: "'Space Mono'", fontSize: '11px', fontWeight: 700, color: '#0D0D0D' }}>{a.meta}</span>
                          </div>
                          <p style={{ fontSize: '14px', lineHeight: 1.55, color: '#3f3f3c' }}>{a.body}</p>
                        </div>
                        <button
                          className="son-alert-dismiss"
                          onClick={() => setDismissed(d => [...d, a.id])}
                          style={{ flex: 'none', fontFamily: "'Space Mono'", fontSize: '10px', letterSpacing: '.04em', color: '#a0a09a', background: 'none', border: 'none', cursor: 'pointer' }}
                        >[dismiss]</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
