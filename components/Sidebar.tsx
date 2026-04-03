'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SidebarProps {
  customer: { name: string; email: string }
  initials: string
}

export default function Sidebar({ customer, initials }: SidebarProps) {
  const router = useRouter()
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Close on navigation
  useEffect(() => { setMobileOpen(false) }, [path])

  async function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const nav = [
    { icon: '◫', label: 'Dashboard', href: '/dashboard', active: path === '/dashboard' },
    { icon: '◉', label: 'Meine Agents', href: '/dashboard', active: path.startsWith('/agent') },
  ]

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#F87171', letterSpacing: '-0.5px' }}>DESEO</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#A78BFA', letterSpacing: '-0.5px' }}>AI</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Voice Agent Portal</div>
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
            fontSize: 22, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
          }}>×</button>
        )}
      </div>

      {/* Nav */}
      <div style={{ padding: '8px 10px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 8 }}>Menü</div>
        {nav.map(item => (
          <div
            key={item.label}
            onClick={() => { router.push(item.href); setMobileOpen(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
              background: item.active ? 'rgba(108,92,231,0.15)' : 'transparent',
              color: item.active ? '#A78BFA' : 'rgba(255,255,255,0.55)',
              fontWeight: item.active ? 600 : 400, fontSize: 13,
              transition: 'all 0.15s',
              borderLeft: item.active ? '2px solid #A78BFA' : '2px solid transparent',
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0, opacity: item.active ? 1 : 0.6 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 10px' }} />

        <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#34D399' }}>Systeme online</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Alle Services aktiv</div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #E03E3E, #6C5CE7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {customer.name || 'Kunde'}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {customer.email}
            </div>
          </div>
          <button onClick={handleLogout} title="Abmelden"
            style={{
              padding: '5px 7px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', cursor: 'pointer',
              fontSize: 11, color: 'rgba(255,255,255,0.3)', transition: 'all 0.15s',
            }}>↩</button>
        </div>
      </div>
    </>
  )

  // Mobile: hamburger button + slide-in drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Bar */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: 52, background: '#0F1117',
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <button onClick={() => setMobileOpen(true)} style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
            fontSize: 20, cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
          }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#F87171' }}>DESEO</span>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#A78BFA' }}>AI</span>
          </div>
        </div>

        {/* Overlay */}
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 98,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          }} />
        )}

        {/* Slide-in Sidebar */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 99,
          width: 260, background: '#0F1117',
          display: 'flex', flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
        }}>
          {sidebarContent}
        </aside>
      </>
    )
  }

  // Desktop: normal sidebar
  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#0F1117',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
    }}>
      {sidebarContent}
    </aside>
  )
}
