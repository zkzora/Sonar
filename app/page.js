'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const STEPS = [
  { n: '01', title: 'READ', body: 'Sonar reads your position state directly from Clarity contracts on Stacks — health factor, collateral ratio, borrow rate — in real time.', note: 'No wallet connection required to monitor.' },
  { n: '02', title: 'COMPUTE', body: "The agent continuously calculates your health factor and tracks what's driving changes: sBTC price movement, rising borrow rates, or both.", note: 'You see the cause, not just the number.' },
  { n: '03', title: 'ALERT', body: 'When your position approaches the liquidation threshold, Sonar sends an alert — via Telegram or email — with a plain-English explanation and suggested action.', note: 'You act in your own wallet.' },
]

const FEATURES = [
  { tag: 'NON-CUSTODIAL', body: 'Sonar never holds your keys or funds. Read-only by design.' },
  { tag: 'STACKS-NATIVE', body: 'Reads directly from Clarity contracts. No proxy, no wrapper.' },
  { tag: 'AGENTIC EXPLANATIONS', body: 'Not just "health dropped" — but why, and what to do next.' },
  { tag: 'ALWAYS WATCHING', body: 'Continuous position monitoring so you never have to check manually.' },
]

const FAQS = [
  { q: 'What is a health factor?', a: 'A ratio showing how safe your position is. Below 1.0 means liquidated. Sonar alerts you before you get there.' },
  { q: 'Does Sonar need my private key or wallet?', a: 'No. Sonar reads on-chain state via public read-only calls. You provide your wallet address, not your wallet.' },
  { q: 'Which protocols are supported?', a: 'Zest is live at launch. Granite is coming next. More protocols are planned after that.' },
  { q: 'How fast are alerts?', a: 'Position checks run continuously. Alert delivery via Telegram or email arrives within seconds of a threshold breach.' },
  { q: 'What happens if Sonar misses an alert?', a: 'Sonar provides best-effort monitoring, not guaranteed liquidation prevention. Always maintain a safe health buffer.' },
]

export default function Home() {
  const [openFaq, setOpenFaq] = useState(0)
  const numRef = useRef(null)
  const arcRef = useRef(null)
  const statusRef = useRef(null)

  // hero instrument animation
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const arc = arcRef.current
    const num = numRef.current
    const status = statusRef.current
    if (!arc) return
    const TARGET = 0.82
    const TARGET_OFFSET = +(100 * (1 - TARGET)).toFixed(1) // 18
    arc.style.strokeDashoffset = '100'
    if (num) num.textContent = '0.00'
    if (status) status.style.opacity = '0'
    if (reduce) {
      arc.style.strokeDashoffset = String(TARGET_OFFSET)
      if (num) num.textContent = '0.82'
      if (status) status.style.opacity = '1'
      return
    }
    arc.getBoundingClientRect()
    requestAnimationFrame(() => {
      arc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)'
      arc.style.strokeDashoffset = String(TARGET_OFFSET)
      const t0 = performance.now()
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / 1200)
        const e = 1 - Math.pow(1 - t, 3)
        if (num) num.textContent = (TARGET * e).toFixed(2)
        if (t < 1) requestAnimationFrame(tick)
        else if (num) num.textContent = '0.82'
      }
      requestAnimationFrame(tick)
    })
    setTimeout(() => {
      if (status) { status.style.transition = 'opacity .5s ease'; status.style.opacity = '1' }
    }, 1250)
    setTimeout(() => {
      arc.style.transition = 'none'
      arc.style.strokeDashoffset = String(TARGET_OFFSET)
      if (num) num.textContent = '0.82'
      if (status) { status.style.transition = 'none'; status.style.opacity = '1' }
    }, 1700)
  }, [])

  // scroll reveal
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return
    const targets = Array.from(document.querySelectorAll('[data-reveal]'))
    targets.forEach(el => {
      const dist = el.getAttribute('data-reveal-dist') || '16'
      el.style.opacity = '0'
      el.style.transform = `translateY(${dist}px)`
      el.style.willChange = 'opacity, transform'
    })
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return
        const el = en.target
        const d = parseInt(el.getAttribute('data-reveal-delay') || '0', 10)
        el.style.transition = `opacity .55s ease ${d}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${d}ms`
        el.style.opacity = '1'
        el.style.transform = 'none'
        obs.unobserve(el)
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    targets.forEach(el => io.observe(el))
    const guard = setTimeout(() => {
      targets.forEach(el => { el.style.transition = 'none'; el.style.opacity = '1'; el.style.transform = 'none' })
    }, 4000)
    return () => { io.disconnect(); clearTimeout(guard) }
  }, [])

  return (
    <div style={{ background: '#F0EFEB', color: '#0D0D0D', fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '62px', zIndex: 50, background: 'rgba(240,239,235,.82)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(18px,5vw,40px)' }}>
          <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Image src="/sonar-logo.png" alt="Sonar" width={32} height={32} style={{ display: 'block' }} />
            <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '19px', letterSpacing: '.22em' }}>SONAR</span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px,3vw,28px)' }}>
            <a href="https://x.com/sonaragent_" target="_blank" rel="noopener noreferrer" className="son-link-underline" style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', letterSpacing: '.06em', color: '#444' }}>
              X / Twitter <span style={{ fontSize: '11px' }}>↗</span>
            </a>
            <a href="#" className="son-btn-orange-sm" style={{ fontFamily: "'Space Mono', monospace", fontSize: '12px', letterSpacing: '.08em', textTransform: 'uppercase', background: '#FF5C00', color: '#fff', padding: '10px 16px', borderRadius: '3px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              Join Telegram <span style={{ fontSize: '13px' }}>→</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ── CONTAINER ── */}
      <div id="top" style={{ position: 'relative', maxWidth: '1320px', margin: '0 auto', borderLeft: '1px solid rgba(0,0,0,.1)', borderRight: '1px solid rgba(0,0,0,.1)', paddingTop: '62px' }}>

        {/* ── HERO ── */}
        <section style={{ position: 'relative', padding: 'clamp(40px,6vw,64px) clamp(20px,5vw,40px) clamp(40px,5vw,56px)', borderBottom: '1px solid rgba(0,0,0,.1)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(90deg,rgba(0,0,0,.035) 1px,transparent 1px),linear-gradient(rgba(0,0,0,.03) 1px,transparent 1px)', backgroundSize: '88px 88px', zIndex: 0 }} />
          <span style={{ position: 'absolute', top: '18px', left: '18px', width: '18px', height: '18px', borderTop: '1.5px solid #0D0D0D', borderLeft: '1.5px solid #0D0D0D', zIndex: 2 }} />
          <span style={{ position: 'absolute', top: '18px', right: '18px', fontFamily: "'Space Mono'", fontSize: '13px', color: 'rgba(0,0,0,.3)', zIndex: 2 }}>+</span>
          <span style={{ position: 'absolute', bottom: '20px', left: '50%', fontFamily: "'Space Mono'", fontSize: '13px', color: 'rgba(0,0,0,.22)', zIndex: 2 }}>+</span>
          <span style={{ position: 'absolute', bottom: '18px', left: '18px', fontFamily: "'Space Mono'", fontSize: '13px', color: 'rgba(0,0,0,.24)', zIndex: 2 }}>+</span>
          <span style={{ position: 'absolute', top: '50%', left: '84px', fontFamily: "'Space Mono'", fontSize: '11px', color: 'rgba(0,0,0,.16)', zIndex: 2 }}>+</span>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,4vw,52px)', alignItems: 'center' }}>
            {/* LEFT */}
            <div data-reveal="1" data-reveal-delay="0" style={{ flex: '1.4 1 400px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '11.5px', letterSpacing: '.16em', color: '#8a8a85', textTransform: 'uppercase', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
                <span>Stacks DeFi Guardian</span><span style={{ color: '#FF5C00' }}>·</span><span>Non-Custodial</span><span style={{ color: '#FF5C00' }}>·</span><span>Mainnet</span>
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(42px,7vw,74px)', lineHeight: .94, letterSpacing: '-.03em', textTransform: 'uppercase', marginBottom: '26px' }}>
                Know before<br />you&apos;re hit<span style={{ color: '#FF5C00' }}>.</span>
              </h1>
              <p style={{ fontSize: 'clamp(16px,1.5vw,18px)', lineHeight: 1.55, color: '#3a3a37', maxWidth: '460px', marginBottom: '32px' }}>
                Sonar monitors your sBTC lending positions on Stacks and alerts you before liquidation — with an explanation of <em style={{ fontStyle: 'normal', color: '#0D0D0D', borderBottom: '1.5px solid #FF5C00' }}>why</em> your health is dropping, not just that it is.
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '38px' }}>
                <a href="/dashboard" className="son-btn-orange" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', background: '#FF5C00', color: '#fff', fontWeight: 600, fontSize: '15px', padding: '15px 26px', borderRadius: '3px' }}>→ Connect Position</a>
                <a href="#" className="son-btn-outline-dark" style={{ display: 'inline-flex', alignItems: 'center', gap: '9px', border: '1px solid rgba(0,0,0,.85)', color: '#0D0D0D', fontWeight: 500, fontSize: '15px', padding: '15px 26px', borderRadius: '3px' }}>Join Telegram <span style={{ fontSize: '13px' }}>↗</span></a>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: '1px solid rgba(0,0,0,.1)' }}>
                <div style={{ flex: '1 1 110px', padding: '14px 16px 0 0', borderRight: '1px solid rgba(0,0,0,.1)' }}><div style={{ fontFamily: "'Space Mono'", fontSize: '10px', letterSpacing: '.1em', color: '#a0a09a', marginBottom: '4px' }}>PROTOCOL</div><div style={{ fontFamily: "'Space Mono'", fontSize: '13px', fontWeight: 700 }}>ZEST</div></div>
                <div style={{ flex: '1 1 110px', padding: '14px 16px', borderRight: '1px solid rgba(0,0,0,.1)' }}><div style={{ fontFamily: "'Space Mono'", fontSize: '10px', letterSpacing: '.1em', color: '#a0a09a', marginBottom: '4px' }}>COLLATERAL</div><div style={{ fontFamily: "'Space Mono'", fontSize: '13px', fontWeight: 700 }}>sBTC</div></div>
                <div style={{ flex: '1.4 1 140px', padding: '14px 0 0 16px' }}><div style={{ fontFamily: "'Space Mono'", fontSize: '10px', letterSpacing: '.1em', color: '#a0a09a', marginBottom: '4px' }}>NETWORK</div><div style={{ fontFamily: "'Space Mono'", fontSize: '13px', fontWeight: 700 }}>STACKS MAINNET</div></div>
              </div>
            </div>

            {/* RIGHT: LIVE MONITOR */}
            <div style={{ flex: '1 1 320px', maxWidth: '460px', margin: '0 auto', width: '100%' }}>
              <div style={{ position: 'relative', background: '#FAFAF7', border: '1px solid rgba(0,0,0,.12)', padding: 'clamp(22px,3vw,30px) clamp(20px,3vw,28px) 20px' }}>
                <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '16px', height: '16px', borderTop: '2px solid #FF5C00', borderLeft: '2px solid #FF5C00' }} />
                <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '16px', height: '16px', borderTop: '2px solid #FF5C00', borderRight: '2px solid #FF5C00' }} />
                <span style={{ position: 'absolute', bottom: '-1px', left: '-1px', width: '16px', height: '16px', borderBottom: '2px solid #FF5C00', borderLeft: '2px solid #FF5C00' }} />
                <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '16px', height: '16px', borderBottom: '2px solid #FF5C00', borderRight: '2px solid #FF5C00' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.12em', color: '#8a8a85', marginBottom: 'clamp(22px,3.5vw,30px)' }}>
                  <span>LIVE MONITOR</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', background: '#EAB308', borderRadius: '50%', animation: 'son-blink 1.4s ease-in-out infinite' }} />
                    SYNCING
                  </span>
                </div>
                {/* Arc gauge */}
                <div style={{ position: 'relative', margin: '0 auto clamp(6px,1.5vw,10px)' }}>
                  <svg viewBox="0 0 240 185" style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {/* track */}
                    <path d="M56,164 A90 90 0 1 1 184,164" fill="none" stroke="#E7E5DF" strokeWidth="13" strokeLinecap="round" />
                    {/* fill — animated via ref */}
                    <path ref={arcRef} d="M56,164 A90 90 0 1 1 184,164" pathLength="100" fill="none" stroke="#EAB308" strokeWidth="13" strokeLinecap="round" strokeDasharray="100" strokeDashoffset="100" />
                    {/* liquidation tick */}
                    <line x1="184" y1="164" x2="191" y2="171" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                    {/* scale labels */}
                    <text x="44" y="181" fontFamily="'Space Mono',monospace" fontSize="10" fill="#a0a09a" textAnchor="middle">0.0</text>
                    <text x="196" y="181" fontFamily="'Space Mono',monospace" fontSize="10" fill="#EF4444" textAnchor="middle">1.0</text>
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '18px', pointerEvents: 'none' }}>
                    <div ref={numRef} style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(50px,8vw,62px)', lineHeight: .85, letterSpacing: '-.03em', color: '#EAB308' }}>0.00</div>
                    <div style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.16em', color: '#8a8a85', marginTop: '8px' }}>HEALTH FACTOR</div>
                    <div ref={statusRef} style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.05em', color: '#FF5C00', fontWeight: 700, border: '1px solid rgba(255,92,0,.45)', padding: '4px 8px', background: 'rgba(255,92,0,.06)', opacity: 0 }}>⚠ APPROACHING</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.08em', color: '#a0a09a', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,.08)' }}>
                  <span>POSITION 0x9f…a2e1</span><span style={{ color: '#8a8a85' }}>THRESHOLD <span style={{ color: '#EF4444' }}>1.00</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS BAR ── */}
        <section style={{ background: '#E9E7E0', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
          <div data-reveal="1" data-reveal-delay="0" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
            <div style={{ padding: '32px clamp(20px,3vw,40px)', borderRight: '1px solid rgba(0,0,0,.1)' }}><div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(30px,4vw,42px)', letterSpacing: '-.02em', lineHeight: 1 }}>$75.9M</div><div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '6px' }}>TVL MONITORED</div></div>
            <div style={{ padding: '32px clamp(20px,3vw,40px)', borderRight: '1px solid rgba(0,0,0,.1)' }}><div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(30px,4vw,42px)', letterSpacing: '-.02em', lineHeight: 1 }}>sBTC</div><div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '6px' }}>COLLATERAL</div></div>
            <div style={{ padding: '32px clamp(20px,3vw,40px)', borderRight: '1px solid rgba(0,0,0,.1)' }}><div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(30px,4vw,42px)', letterSpacing: '-.02em', lineHeight: 1 }}>&lt;60<span style={{ fontSize: '.5em', color: '#8a8a85' }}> sec</span></div><div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '6px' }}>ALERT LATENCY</div></div>
            <div style={{ padding: '32px clamp(20px,3vw,40px)' }}><div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(30px,4vw,42px)', letterSpacing: '-.02em', lineHeight: 1, color: '#FF5C00' }}>0</div><div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '6px' }}>FUNDS CUSTODIED</div></div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section style={{ position: 'relative', padding: 'clamp(48px,6vw,72px) clamp(20px,5vw,40px)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px,4vw,40px)', alignItems: 'flex-start' }}>
            <div data-reveal="1" data-reveal-delay="0" style={{ flex: '1 1 240px' }}>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.16em', color: '#8a8a85', marginBottom: '16px' }}>[ PROCESS ]</div>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(72px,12vw,118px)', lineHeight: .82, color: 'transparent', WebkitTextStroke: '1.4px rgba(0,0,0,.24)', marginBottom: '22px', letterSpacing: '-.02em' }}>HOW</div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 'clamp(26px,3vw,30px)', lineHeight: 1.08, letterSpacing: '-.02em' }}>Three steps.<br />Zero custody.</h2>
            </div>
            <div style={{ flex: '2.2 1 460px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', borderTop: '1px solid rgba(0,0,0,.12)', borderLeft: '1px solid rgba(0,0,0,.12)' }}>
              {STEPS.map((step, i) => (
                <div key={i} data-reveal="1" data-reveal-delay={i * 90} style={{ borderRight: '1px solid rgba(0,0,0,.12)', borderBottom: '1px solid rgba(0,0,0,.12)', padding: '26px 24px 30px', position: 'relative' }}>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#FF5C00', fontWeight: 700, marginBottom: '20px' }}>[{step.n}]</div>
                  <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '22px', letterSpacing: '.02em', marginBottom: '14px' }}>{step.title}</div>
                  <div style={{ height: '1px', background: 'rgba(0,0,0,.14)', marginBottom: '16px' }} />
                  <p style={{ fontSize: '14.5px', lineHeight: 1.55, color: '#444', marginBottom: '16px' }}>{step.body}</p>
                  <p style={{ fontFamily: "'Space Mono'", fontSize: '11.5px', lineHeight: 1.5, color: '#8a8a85' }}>{step.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY SONAR (DARK) ── */}
        <section style={{ background: '#111111', color: '#fff', padding: 'clamp(56px,7vw,80px) clamp(20px,5vw,40px)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '24px', right: '24px', fontFamily: "'Space Mono'", fontSize: '14px', color: 'rgba(255,255,255,.25)' }}>+</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,5vw,56px)', alignItems: 'flex-start' }}>
            <div data-reveal="1" data-reveal-delay="0" style={{ flex: '1 1 320px' }}>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.16em', color: '#FF5C00', marginBottom: '24px' }}>BUILT FOR STACKS DEFI</div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(30px,4vw,44px)', lineHeight: 1.04, letterSpacing: '-.025em' }}>Your collateral is on Bitcoin.<br /><span style={{ color: '#7a7a78' }}>Your guardian should be too.</span></h2>
            </div>
            <div data-reveal="1" data-reveal-delay="90" style={{ flex: '1 1 320px' }}>
              <p style={{ fontSize: '16px', lineHeight: 1.65, color: '#c9c9c5', marginBottom: '18px' }}>sBTC collateral lives inside Clarity contracts, settled on Stacks and anchored to Bitcoin. That data doesn&apos;t exist anywhere else — and neither does the risk.</p>
              <p style={{ fontSize: '16px', lineHeight: 1.65, color: '#c9c9c5' }}>Sonar is built specifically for this: reading Stacks contract state, tracking sBTC-denominated positions, and warning you <em style={{ fontStyle: 'normal', color: '#fff', borderBottom: '1.5px solid #FF5C00' }}>before</em> the chain does it for you.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', borderTop: '1px solid rgba(255,255,255,.14)', borderLeft: '1px solid rgba(255,255,255,.14)', marginTop: '48px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} data-reveal="1" data-reveal-delay={i * 70} style={{ borderRight: '1px solid rgba(255,255,255,.14)', borderBottom: '1px solid rgba(255,255,255,.14)', padding: '28px 30px' }}>
                <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', letterSpacing: '.1em', color: '#FF5C00', fontWeight: 700, marginBottom: '14px' }}>[ {f.tag} ]</div>
                <p style={{ fontSize: '15.5px', lineHeight: 1.55, color: '#d8d8d4' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PROTOCOLS ── */}
        <section style={{ padding: 'clamp(48px,6vw,72px) clamp(20px,5vw,40px)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
          <div data-reveal="1" data-reveal-delay="0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '34px' }}>
            <div>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.16em', color: '#8a8a85', marginBottom: '14px' }}>LIVE COVERAGE</div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 'clamp(28px,3.4vw,34px)', letterSpacing: '-.02em' }}>Protocols Sonar watches.</h2>
            </div>
            <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', color: '#a0a09a' }}>[ 01 / 03 ACTIVE ]</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '18px', alignItems: 'stretch' }}>

            {/* ZEST — LIVE */}
            <div data-reveal="1" data-reveal-delay="0" className="son-card-hover" style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: '#FAFAF7', border: '1px solid rgba(0,0,0,.12)', padding: '24px 24px 22px' }}>
              <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '13px', height: '13px', borderTop: '1.5px solid rgba(0,0,0,.4)', borderLeft: '1.5px solid rgba(0,0,0,.4)' }} />
              <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '13px', height: '13px', borderBottom: '1.5px solid rgba(0,0,0,.4)', borderRight: '1.5px solid rgba(0,0,0,.4)' }} />
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '22px', letterSpacing: '.01em', marginBottom: '14px' }}>ZEST</div>
              <div style={{ height: '1px', background: 'rgba(0,0,0,.12)', marginBottom: '14px' }} />
              <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#555', marginBottom: '8px' }}>Lending · sBTC collateral</div>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#222' }}>$75.9M TVL</div>
              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', animation: 'son-blink 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.1em', color: '#1a8a40' }}>LIVE</span>
              </div>
            </div>

            {/* GRANITE — IN PROGRESS */}
            <div data-reveal="1" data-reveal-delay="90" className="son-card-hover" style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: '#FAFAF7', border: '1px solid rgba(0,0,0,.12)', padding: '24px 24px 22px' }}>
              <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '13px', height: '13px', borderTop: '1.5px solid rgba(0,0,0,.4)', borderLeft: '1.5px solid rgba(0,0,0,.4)' }} />
              <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '13px', height: '13px', borderBottom: '1.5px solid rgba(0,0,0,.4)', borderRight: '1.5px solid rgba(0,0,0,.4)' }} />
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '22px', letterSpacing: '.01em', marginBottom: '14px' }}>GRANITE</div>
              <div style={{ height: '1px', background: 'rgba(0,0,0,.12)', marginBottom: '14px' }} />
              <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#555', marginBottom: '8px' }}>Lending · sBTC collateral</div>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#a0a09a' }}>COMING SOON</div>
              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EAB308' }} />
                <span style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.1em', color: '#8a8a85' }}>IN PROGRESS</span>
              </div>
            </div>

            {/* MORE COMING — PLANNED */}
            <div data-reveal="1" data-reveal-delay="180" className="son-card-hover" style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: '#FAFAF7', border: '1px solid rgba(0,0,0,.12)', padding: '24px 24px 22px' }}>
              <span style={{ position: 'absolute', top: '-1px', left: '-1px', width: '13px', height: '13px', borderTop: '1.5px solid rgba(0,0,0,.4)', borderLeft: '1.5px solid rgba(0,0,0,.4)' }} />
              <span style={{ position: 'absolute', bottom: '-1px', right: '-1px', width: '13px', height: '13px', borderBottom: '1.5px solid rgba(0,0,0,.4)', borderRight: '1.5px solid rgba(0,0,0,.4)' }} />
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '22px', letterSpacing: '.01em', marginBottom: '14px' }}>MORE COMING</div>
              <div style={{ height: '1px', background: 'rgba(0,0,0,.12)', marginBottom: '14px' }} />
              <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#555', marginBottom: '8px' }}>Velar Perps + others</div>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '12px', color: '#a0a09a' }}>PLANNED</div>
              <div style={{ marginTop: 'auto', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a0a09a' }} />
                <span style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.1em', color: '#8a8a85' }}>PLANNED</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── ALERT PREVIEW ── */}
        <section style={{ padding: 'clamp(48px,6vw,72px) clamp(20px,5vw,40px)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px,4vw,48px)', alignItems: 'center' }}>
            <div data-reveal="1" data-reveal-delay="0" style={{ flex: '1 1 300px' }}>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.16em', color: '#8a8a85', marginBottom: '14px' }}>WHAT YOU&apos;LL RECEIVE</div>
              <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 600, fontSize: 'clamp(30px,3.8vw,38px)', lineHeight: 1.06, letterSpacing: '-.02em', marginBottom: '20px' }}>An alert that<br />explains itself.</h2>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#444', maxWidth: '360px' }}>No cryptic numbers. Every Sonar alert tells you what changed, why it changed, and exactly what to do next — in plain English.</p>
            </div>
            <div data-reveal="1" data-reveal-delay="120" data-reveal-dist="8" style={{ position: 'relative', flex: '1.1 1 360px', background: '#fff', border: '1px solid rgba(0,0,0,.14)', borderLeft: '4px solid #FF5C00' }}>
              <span style={{ position: 'absolute', top: '-1px', right: '-1px', width: '14px', height: '14px', borderTop: '2px solid #FF5C00', borderRight: '2px solid #FF5C00' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', borderBottom: '1px solid rgba(0,0,0,.1)', background: '#FAFAF7' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '9px', height: '9px', background: '#FF5C00', borderRadius: '50%', animation: 'son-blink 1.4s ease-in-out infinite' }} />
                  <span style={{ fontFamily: "'Space Mono'", fontSize: '12px', fontWeight: 700, letterSpacing: '.14em' }}>SONAR ALERT</span>
                </span>
                <span style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.08em', color: '#a0a09a' }}>23:14 UTC · ZEST</span>
              </div>
              <div style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px' }}>
                    <span style={{ fontFamily: "'Space Mono'", fontSize: '10px', letterSpacing: '.12em', color: '#8a8a85' }}>HF</span>
                    <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '21px', lineHeight: 1, color: '#EAB308' }}>1.12</span>
                    <span style={{ fontFamily: "'Space Mono'", color: '#bbb' }}>→</span>
                    <span style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: '21px', lineHeight: 1, color: '#FF5C00' }}>1.00</span>
                  </div>
                  <span style={{ fontFamily: "'Space Mono'", fontSize: '9.5px', letterSpacing: '.05em', color: '#FF5C00', fontWeight: 700, border: '1px solid rgba(255,92,0,.45)', padding: '4px 7px', background: 'rgba(255,92,0,.06)' }}>⚠ APPROACHING</span>
                </div>
                <div style={{ position: 'relative', height: '8px', background: '#EFEDE6', backgroundImage: 'repeating-linear-gradient(90deg,rgba(0,0,0,.13) 0 1px,transparent 1px 10%)', marginBottom: '20px' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '89%', background: '#EAB308' }} />
                  <div style={{ position: 'absolute', right: 0, top: '-2px', bottom: '-2px', width: '2px', background: '#EF4444' }} />
                </div>
                <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#222', marginBottom: '18px' }}>Your <strong>Zest</strong> position is nearing the liquidation threshold.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px 16px', alignItems: 'baseline', borderTop: '1px solid rgba(0,0,0,.1)', paddingTop: '18px', marginBottom: '22px' }}>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.1em', color: '#FF5C00', fontWeight: 700 }}>WHY</div>
                  <p style={{ fontSize: '14px', lineHeight: 1.55, color: '#444' }}>sBTC dropped <span style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', color: '#EF4444', background: 'rgba(239,68,68,.08)', padding: '1px 5px' }}>−6.4%</span> in 3h — collateral fell <span style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', background: 'rgba(0,0,0,.05)', padding: '1px 5px' }}>$8,420</span> → <span style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', background: 'rgba(0,0,0,.05)', padding: '1px 5px' }}>$7,880</span>.</p>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: '10.5px', letterSpacing: '.1em', color: '#0D0D0D', fontWeight: 700 }}>ACTION</div>
                  <p style={{ fontSize: '14px', lineHeight: 1.55, color: '#444' }}>Add <span style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', background: 'rgba(0,0,0,.05)', padding: '1px 5px' }}>$540</span> collateral or repay <span style={{ fontFamily: "'Space Mono'", fontSize: '12.5px', background: 'rgba(0,0,0,.05)', padding: '1px 5px' }}>$300</span> to restore a safe buffer.</p>
                </div>
                <a href="#" className="son-alert-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#FF5C00', color: '#fff', fontFamily: "'Space Mono'", fontSize: '12px', letterSpacing: '.06em', padding: '11px 18px', borderRadius: '3px' }}>→ Open Zest</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ position: 'relative', padding: 'clamp(48px,6vw,72px) clamp(20px,5vw,40px)', borderBottom: '1px solid rgba(0,0,0,.1)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px,4vw,40px)', alignItems: 'flex-start' }}>
            <div data-reveal="1" data-reveal-delay="0" style={{ flex: '1 1 180px' }}>
              <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(56px,8vw,72px)', lineHeight: .85, color: 'transparent', WebkitTextStroke: '1.3px rgba(0,0,0,.24)', letterSpacing: '-.02em' }}>FAQ</div>
              <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', letterSpacing: '.12em', color: '#8a8a85', marginTop: '16px' }}>MOST COMMON<br />QUESTIONS</div>
            </div>
            <div data-reveal="1" data-reveal-delay="80" style={{ flex: '3 1 420px', borderTop: '1px solid rgba(0,0,0,.14)' }}>
              {FAQS.map((faq, i) => {
                const open = i === openFaq
                return (
                  <div key={i} style={{ borderBottom: '1px solid rgba(0,0,0,.14)' }}>
                    <button
                      className="son-faq-btn"
                      onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '22px 4px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fontSize: 'clamp(16px,1.8vw,18px)', color: '#0D0D0D', transition: 'background .15s ease' }}
                    >
                      <span>{faq.q}</span>
                      <span style={{ flex: 'none', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px', fontSize: '20px', fontWeight: 400, lineHeight: 1, transition: 'transform .3s ease,background .3s ease,color .3s ease', transform: `rotate(${open ? '45deg' : '0deg'})`, background: open ? '#FF5C00' : '#EFEDE6', color: open ? '#fff' : '#0D0D0D' }}>+</span>
                    </button>
                    <div style={{ overflow: 'hidden', transition: 'max-height .4s ease,opacity .35s ease', maxHeight: open ? '240px' : '0px', opacity: open ? 1 : 0 }}>
                      <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#555', maxWidth: '660px', padding: '0 4px 24px' }}>{faq.a}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA (DARK) ── */}
        <section style={{ background: '#111111', color: '#fff', padding: 'clamp(60px,8vw,84px) clamp(20px,5vw,40px) 0', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: '26px', left: '26px', width: '18px', height: '18px', borderTop: '1.5px solid rgba(255,255,255,.35)', borderLeft: '1.5px solid rgba(255,255,255,.35)' }} />
          <span style={{ position: 'absolute', top: '26px', right: '26px', width: '18px', height: '18px', borderTop: '1.5px solid rgba(255,255,255,.35)', borderRight: '1.5px solid rgba(255,255,255,.35)' }} />
          <div data-reveal="1" data-reveal-delay="0" style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 36px' }}>
            <h2 style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(34px,6vw,58px)', lineHeight: 1.02, letterSpacing: '-.03em' }}>Your next liquidation<br />won&apos;t announce itself.</h2>
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', color: '#FF5C00', marginTop: '14px', letterSpacing: '-.01em' }}>Sonar will.</div>
          </div>
          <div data-reveal="1" data-reveal-delay="120" style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <a href="/dashboard" className="son-btn-orange" style={{ background: '#FF5C00', color: '#fff', fontWeight: 600, fontSize: '15px', padding: '15px 28px', borderRadius: '3px' }}>→ Start Monitoring</a>
            <a href="#" className="son-btn-outline-white" style={{ border: '1px solid rgba(255,255,255,.4)', color: '#fff', fontWeight: 500, fontSize: '15px', padding: '15px 28px', borderRadius: '3px' }}>Join Telegram ↗</a>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '22px 0', borderTop: '1px solid rgba(255,255,255,.14)' }}>
            <div style={{ fontFamily: "'Space Mono'", fontSize: '11.5px', letterSpacing: '.08em', color: '#9a9a96' }}>SONAR · Built on Stacks · Non-custodial</div>
            <div style={{ display: 'flex', gap: '22px', fontFamily: "'Space Mono'", fontSize: '11.5px', letterSpacing: '.08em', color: '#cfcfca' }}>
              <a href="https://x.com/sonaragent_" target="_blank" rel="noopener noreferrer" className="son-sidebar-link">X / Twitter ↗</a>
              <a href="#" className="son-sidebar-link">Telegram ↗</a>
            </div>
          </div>
          <div style={{ fontFamily: "'Space Mono'", fontSize: '11px', color: '#6a6a66', padding: '18px 0 30px' }}>© 2026 Sonar. Not financial advice. Best-effort monitoring only.</div>
          <div style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,.14)', padding: '30px 0 0', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', top: '30px', left: 0, width: '10px', height: '10px', background: '#FF5C00' }} />
            <span style={{ position: 'absolute', top: '30px', right: 0, width: '10px', height: '10px', background: '#FF5C00' }} />
            <div style={{ fontFamily: "'Space Grotesk'", fontWeight: 700, fontSize: 'clamp(80px,16vw,230px)', lineHeight: .82, textAlign: 'center', letterSpacing: '.04em', color: '#fff', paddingBottom: '24px' }}>SONAR</div>
          </div>
        </section>

      </div>
    </div>
  )
}
