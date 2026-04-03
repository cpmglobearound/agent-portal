'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const TYPE_INFO: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'realtime': { label: 'GPT Realtime', color: '#6C5CE7', bg: '#F0EEFA', icon: '⚡' },
  'stt-llm-tts': { label: 'STT→LLM→TTS', color: '#2563EB', bg: '#EFF6FF', icon: '🔗' },
  'gemini-live': { label: 'Gemini Live', color: '#059669', bg: '#ECFDF5', icon: '✦' },
}

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  return m
}

export default function DashboardPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState({ name: '', email: '' })
  const isMobile = useIsMobile()

  useEffect(() => {
    fetch('/api/agent/list')
      .then(res => { if (res.status === 401) { router.push('/login'); return null } return res.json() })
      .then(data => { if (!data) return; setAgents(data.agents || []); setCustomer(data.customer || {}) })
      .catch(() => setLoading(false))
  }, [router])

  const initials = customer.name ? customer.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar customer={customer} initials={initials} />

      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', paddingTop: isMobile ? 52 : 0 }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px 16px' : '24px 36px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div className="animate-in">
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, letterSpacing: '-0.4px', color: 'var(--text)' }}>
              {greeting}, {customer.name?.split(' ')[0] || 'Willkommen'}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
              Verwalten Sie Ihre Voice Agents
            </p>
          </div>
        </div>

        <div style={{ padding: isMobile ? '16px' : '28px 36px' }}>
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14, marginBottom: isMobile ? 20 : 32 }} className="animate-in stagger-1">
            {[
              { label: 'Aktive Agents', value: loading ? '—' : agents.length, sub: 'In Betrieb', accent: 'var(--purple)', bg: 'var(--purple-light)' },
              { label: 'Agent-Typen', value: loading ? '—' : [...new Set(agents.map(a => { try { return JSON.parse(a.config_json)?.type } catch { return '?' } }))].length, sub: 'Verschiedene Pipelines', accent: 'var(--blue)', bg: 'var(--blue-light)' },
              { label: 'Verfügbarkeit', value: '99.9%', sub: 'Letzte 30 Tage', accent: 'var(--success)', bg: 'var(--success-bg)' },
              { label: 'Deployments', value: '—', sub: 'Diese Woche', accent: 'var(--amber)', bg: 'var(--amber-light)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: isMobile ? '14px 14px' : '18px 20px',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: s.accent, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }} className="animate-in stagger-2">
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px' }}>Ihre Voice Agents</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Klicken Sie auf einen Agent um ihn zu bearbeiten</p>
            </div>
          </div>

          {/* Agent Cards */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {[1, 2].map(i => (
                <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-xl)' }} />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '64px 24px',
              background: 'var(--surface)', borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border-dark)',
            }}>
              <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.6 }}>🎤</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Keine Agents gefunden</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: '0 auto' }}>
                Kontaktieren Sie uns um Ihren ersten Voice Agent einzurichten.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {agents.map((agent, idx) => {
                let config: any = {}
                try { config = JSON.parse(agent.config_json) } catch {}
                const agentType = config.type || 'stt-llm-tts'
                const typeInfo = TYPE_INFO[agentType] || TYPE_INFO['stt-llm-tts']

                let voiceDisplay = '—'
                if (agentType === 'realtime') {
                  voiceDisplay = (config.voice || config.voice_id || '—')
                  voiceDisplay = voiceDisplay.charAt(0).toUpperCase() + voiceDisplay.slice(1)
                } else if (agentType === 'stt-llm-tts') {
                  voiceDisplay = config.tts_voice_name || config.cartesia_voice_name || 'Cartesia'
                } else if (agentType === 'gemini-live') {
                  voiceDisplay = config.gemini_voice || 'Charon'
                }

                return (
                  <div
                    key={agent.id}
                    onClick={() => router.push(`/agent/${agent.id}`)}
                    className="animate-in"
                    style={{
                      animationDelay: `${idx * 0.06}s`,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xl)', overflow: 'hidden',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                    onMouseEnter={e => {
                      if (isMobile) return
                      const d = e.currentTarget as HTMLDivElement
                      d.style.borderColor = 'var(--purple)'
                      d.style.boxShadow = 'var(--shadow-purple)'
                      d.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      if (isMobile) return
                      const d = e.currentTarget as HTMLDivElement
                      d.style.borderColor = 'var(--border)'
                      d.style.boxShadow = 'var(--shadow-xs)'
                      d.style.transform = 'translateY(0)'
                    }}
                  >
                    {/* Card Header */}
                    <div style={{ padding: isMobile ? '16px 16px 12px' : '20px 22px 16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
                        <div style={{
                          width: isMobile ? 38 : 46, height: isMobile ? 38 : 46, borderRadius: 12,
                          background: `linear-gradient(135deg, ${typeInfo.bg}, ${typeInfo.bg})`,
                          border: `1px solid ${typeInfo.color}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: isMobile ? 16 : 20,
                        }}>{typeInfo.icon}</div>
                        <div>
                          <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, letterSpacing: '-0.2px' }}>
                            {config.agent_persona_name || agent.agent_display_name || 'Agent'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                            {config.company_name || agent.service_name || '—'}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--success-bg)', borderRadius: 20, border: '1px solid var(--success-border)', flexShrink: 0 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', letterSpacing: '0.02em' }}>AKTIV</span>
                      </div>
                    </div>

                    {/* Greeting Preview */}
                    <div style={{ margin: isMobile ? '0 16px' : '0 22px', padding: '10px 14px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Begrüßung</div>
                      <div style={{
                        fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                      }}>
                        {config.greeting || '—'}
                      </div>
                    </div>

                    {/* Tags */}
                    <div style={{ padding: isMobile ? '12px 16px' : '14px 22px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700, background: typeInfo.bg, color: typeInfo.color, letterSpacing: '0.02em' }}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text-secondary)' }}>
                        🎙 {voiceDisplay}
                      </span>
                      {config.language && (
                        <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text-secondary)' }}>
                          {config.language === 'de' ? '🇩🇪 Deutsch' : config.language === 'multi' ? '🌍 Multi' : config.language}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{
                      padding: isMobile ? '10px 16px' : '12px 22px',
                      borderTop: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg)',
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Deployed: {agent.last_deployed_at || '—'}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)' }}>
                        Bearbeiten →
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
