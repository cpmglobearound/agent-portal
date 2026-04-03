'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import AgentQuota from '@/components/agent-quota'

/* ═══ VOICE CATALOGS ═══ */
const REALTIME_VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'W', desc: 'Warm, neutral, vielseitig', best: 'Allrounder' },
  { id: 'ash', name: 'Ash', gender: 'M', desc: 'Ruhig, vertrauenswürdig', best: 'Business & Support' },
  { id: 'ballad', name: 'Ballad', gender: 'M', desc: 'Sanft, beruhigend', best: 'Wellness & Beratung' },
  { id: 'cedar', name: 'Cedar', gender: 'M', desc: 'Energetisch, warm, empathisch', best: 'Sales & Outbound' },
  { id: 'coral', name: 'Coral', gender: 'W', desc: 'Freundlich, klar, energetisch', best: 'Sales & Empfang' },
  { id: 'echo', name: 'Echo', gender: 'M', desc: 'Klar, direkt, natürlich', best: 'Info-Hotlines' },
  { id: 'fable', name: 'Fable', gender: 'W', desc: 'Ausdrucksstark, warm', best: 'Storytelling' },
  { id: 'juniper', name: 'Juniper', gender: 'W', desc: 'Lebhaft, jugendlich', best: 'Junge Zielgruppen' },
  { id: 'marin', name: 'Marin', gender: 'W', desc: 'Natürlich, empathisch, modern', best: 'Premium-Empfang' },
  { id: 'nova', name: 'Nova', gender: 'W', desc: 'Professionell, selbstbewusst', best: 'Corporate' },
  { id: 'onyx', name: 'Onyx', gender: 'M', desc: 'Tief, autoritativ, souverän', best: 'Luxus & Premium' },
  { id: 'sage', name: 'Sage', gender: 'W', desc: 'Ruhig, weise, geduldig', best: 'Beratung & Coaching' },
  { id: 'shimmer', name: 'Shimmer', gender: 'W', desc: 'Hell, freundlich, positiv', best: 'Gastronomie & Events' },
  { id: 'verse', name: 'Verse', gender: 'M', desc: 'Dynamisch, engagiert', best: 'Sport & Fitness' },
]

const CARTESIA_VOICES = [
  { id: 'b7187e84-fe22-4344-ba4a-bc013fcb533e', name: 'Marco', gender: 'M', desc: 'Warm, professionell', best: 'Hotel & Empfang' },
  { id: '38aabb6a-f52b-4fb0-a3d1-988518f4dc06', name: 'Hugo', gender: 'M', desc: 'Freundlich, dynamisch', best: 'Sport & Fitness' },
  { id: 'a0e99841-438c-4a64-b679-ae501e7d6091', name: 'Cleo', gender: 'W', desc: 'Empathisch, mehrsprachig', best: 'Corporate & Support' },
]

const GEMINI_VOICES = [
  { id: 'Charon', name: 'Charon', gender: 'M', desc: 'Natürlich, männlich', best: 'Allrounder' },
  { id: 'Kore', name: 'Kore', gender: 'W', desc: 'Klar, weiblich', best: 'Empfang' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'M', desc: 'Tief, ruhig', best: 'Premium' },
  { id: 'Aoede', name: 'Aoede', gender: 'W', desc: 'Warm, melodisch', best: 'Beratung' },
]

const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string; desc: string }> = {
  'realtime': { label: 'GPT Realtime', color: '#6C5CE7', bg: '#F0EEFA', icon: '⚡', desc: 'OpenAI Speech-to-Speech — niedrigste Latenz, Voices von OpenAI' },
  'stt-llm-tts': { label: 'STT → LLM → TTS', color: '#2563EB', bg: '#EFF6FF', icon: '🔗', desc: 'Deepgram STT + OpenAI LLM + Cartesia TTS — maximale Kontrolle' },
  'gemini-live': { label: 'Gemini Live', color: '#059669', bg: '#ECFDF5', icon: '✦', desc: 'Google Speech-to-Speech — günstig, native Audio' },
}

export default function AgentEditorPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string
  const [customer, setCustomer] = useState({ name: '', email: '' })
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deploying, setDeploying] = useState(false)
  const [deployLog, setDeployLog] = useState<string[]>([])
  const [deployDone, setDeployDone] = useState(false)
  const [deployError, setDeployError] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [unsaved, setUnsaved] = useState(false)
  const [deployHistory, setDeployHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [newTerm, setNewTerm] = useState('')
  const [newPron, setNewPron] = useState('')
  const [voiceFilter, setVoiceFilter] = useState<'all' | 'W' | 'M'>('all')

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { const c = () => setIsMobile(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  const [agentQuota, setAgentQuota] = useState<number>(0)
  const [agentNotionDb, setAgentNotionDb] = useState<string>('')

  const initials = customer.name ? customer.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : '?'
  const agentType = config?.type || 'stt-llm-tts'
  const typeMeta = TYPE_META[agentType] || TYPE_META['stt-llm-tts']

  useEffect(() => {
    fetch('/api/agent/list')
      .then(r => { if (r.status === 401) { router.push('/login'); return null } return r.json() })
      .then(data => {
        if (!data) return
        setCustomer(data.customer || {})
        const agent = data.agents?.find((a: any) => a.id == agentId)
        if (agent) {
          try { setConfig(JSON.parse(agent.config_json)) } catch { setConfig({}) }
          if (agent.monthly_minutes_quota) setAgentQuota(agent.monthly_minutes_quota)
          if (agent.notion_database_id) setAgentNotionDb(agent.notion_database_id)
        }
        setLoading(false)
      })
    fetch(`/api/deploy/history?agent_id=${agentId}`)
      .then(r => r.ok ? r.json() : { deploys: [] })
      .then(data => setDeployHistory(data.deploys || []))
      .catch(() => {})
  }, [agentId, router])

  function showToast(msg: string, type: string) { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }
  function upd(key: string, value: any) { setConfig((p: any) => ({ ...p, [key]: value })); setUnsaved(true); setDeployDone(false) }
  function updSection(key: string, value: string) { setConfig((p: any) => ({ ...p, prompt_sections: { ...p.prompt_sections, [key]: value } })); setUnsaved(true); setDeployDone(false) }

  function addDictEntry() {
    if (!newTerm.trim() || !newPron.trim()) return
    upd('pronunciation', { ...(config.pronunciation || {}), [newTerm.trim()]: newPron.trim() })
    setNewTerm(''); setNewPron('')
  }
  function removeDictEntry(key: string) {
    const c = { ...(config.pronunciation || {}) }; delete c[key]; upd('pronunciation', c)
  }

  async function handleDeploy() {
    setDeploying(true); setDeployLog([]); setDeployDone(false); setDeployError(false)
    const steps = ['→ Konfiguration validieren...', '→ Backup erstellen...', '→ Config auf Server schreiben...', '→ Syntax-Prüfung...', '→ Service neu starten...', '→ Health-Check...']
    for (const s of steps) { await new Promise(r => setTimeout(r, 500)); setDeployLog(p => [...p, s]) }
    try {
      const res = await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agentId, config }) })
      const data = await res.json()
      if (data.success) {
        setDeployLog(p => [...p, '✓ Deploy erfolgreich — Agent ist live!']); setDeployDone(true)
        showToast('Agent erfolgreich deployed', 'success')
        setDeployHistory(p => [{ date: new Date().toLocaleString('de-DE'), status: 'success', changes: 'Portal Deploy' }, ...p])
      } else {
        setDeployLog(p => [...p, '✕ ' + (data.message || 'Fehler')]); setDeployError(true)
        showToast('Deploy fehlgeschlagen', 'error')
      }
    } catch {
      setDeployLog(p => [...p, '✕ Netzwerkfehler']); setDeployError(true); showToast('Netzwerkfehler', 'error')
    } finally { setDeploying(false) }
  }

  // Get the right voice list for this agent type
  const voiceCatalog = agentType === 'realtime' ? REALTIME_VOICES : agentType === 'gemini-live' ? GEMINI_VOICES : CARTESIA_VOICES
  const filteredVoices = voiceFilter === 'all' ? voiceCatalog : voiceCatalog.filter(v => v.gender === voiceFilter)

  // Current voice key depends on type
  const currentVoiceId = agentType === 'realtime' ? (config?.voice || config?.voice_id) : agentType === 'gemini-live' ? config?.gemini_voice : (config?.tts_voice_id || config?.cartesia_voice_id)

  function selectVoice(voiceId: string) {
    if (agentType === 'realtime') { upd('voice', voiceId); upd('voice_id', voiceId) }
    else if (agentType == 'gemini-live') { upd('gemini_voice', voiceId) }
    else { upd('tts_voice_id', voiceId); upd('cartesia_voice_id', voiceId) }
  }

  /* ═══ STYLES ═══ */
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s, box-shadow 0.15s' }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical' as const, lineHeight: 1.6, minHeight: 90 }

  if (loading || !config) return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar customer={customer} initials={initials} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: isMobile ? 52 : 0 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 28, height: 28, border: '3px solid var(--purple)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13 }}>Agent wird geladen...</div>
        </div>
      </div>
    </div>
  )

  const dictEntries = Object.entries(config.pronunciation || {})

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar customer={customer} initials={initials} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 20px', borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600,
          background: toast.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          border: `1px solid ${toast.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
          color: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          boxShadow: 'var(--shadow-lg)', animation: 'scaleIn 0.25s ease both',
        }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', minHeight: '100vh' }}>
        {/* ═══ LEFT: EDITOR ═══ */}
        <div style={{ overflowY: 'auto' }}>
          {/* Top Bar */}
          <div style={{
            background: 'var(--surface)', borderBottom: '1px solid var(--border)',
            padding: isMobile ? '12px 16px' : '14px 28px', display: 'flex', alignItems: 'center', gap: 14,
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <button onClick={() => router.push('/dashboard')} style={{
              display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 13,
              cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit',
              padding: '6px 10px', borderRadius: 'var(--radius)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
            >← Zurück</button>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' }}>{config.agent_persona_name || agentId}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{config.company_name} · Agent Editor</div>
            </div>
            {/* Type Badge */}
            <div style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: typeMeta.bg, color: typeMeta.color, letterSpacing: '0.02em' }}>
              {typeMeta.icon} {typeMeta.label}
            </div>
            <a href={`/agent/${agentId}/scores`} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: '#F0FDF4', color: '#059669', letterSpacing: '0.02em',
              textDecoration: 'none', border: '1px solid #BBF7D0', transition: 'all 0.15s',
            }}>📊 Scores</a>
            {unsaved && (
              <div style={{ padding: '4px 10px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--warning)' }}>
                ● Ungespeichert
              </div>
            )}
          </div>


            {/* ═══ KONTINGENT ═══ */}
            {agentQuota > 0 && agentNotionDb && (
              <div style={{ paddingTop: 20 }}>
                <AgentQuota notionDbId={agentNotionDb} quotaMinutes={agentQuota} />
              </div>
            )}
          <div style={{ padding: isMobile ? '16px' : '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* ═══ BEGRÜSSUNG ═══ */}
            <Section icon="👋" title="Begrüßung" desc="Der erste Satz den Ihr Agent am Telefon spricht">
              <textarea style={ta} value={config.greeting || ''} onChange={e => upd('greeting', e.target.value)} rows={3} placeholder="Guten Tag! Willkommen bei..." />
            </Section>

            {/* ═══ VOICE SELECTOR ═══ */}
            <Section icon="🎙️" title="Stimme" desc={agentType === 'realtime' ? 'OpenAI GPT Realtime Voices' : agentType === 'gemini-live' ? 'Google Gemini Voices' : 'Cartesia Sonic-3 Voices'}>
              <div style={{ padding: '10px 14px', background: typeMeta.bg, borderRadius: 'var(--radius)', border: `1px solid ${typeMeta.color}20`, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: typeMeta.color, fontWeight: 600 }}>{typeMeta.icon} {typeMeta.desc}</div>
              </div>

              {/* Gender Filter */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 3, border: '1px solid var(--border)' }}>
                {([['all', 'Alle'], ['W', '♀ Weiblich'], ['M', '♂ Männlich']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setVoiceFilter(val as any)}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
                      background: voiceFilter === val ? 'white' : 'transparent',
                      color: voiceFilter === val ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: voiceFilter === val ? 600 : 400,
                      cursor: 'pointer', boxShadow: voiceFilter === val ? 'var(--shadow-xs)' : 'none',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>{label}</button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : voiceCatalog.length > 6 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 8 }}>
                {filteredVoices.map(v => {
                  const selected = currentVoiceId === v.id
                  return (
                    <div key={v.id} onClick={() => selectVoice(v.id)}
                      style={{
                        padding: '12px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s',
                        border: selected ? `2px solid ${typeMeta.color}` : '1.5px solid var(--border)',
                        background: selected ? typeMeta.bg : 'white',
                        boxShadow: selected ? `0 0 0 3px ${typeMeta.bg}` : 'none',
                      }}
                      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = typeMeta.color + '60' }}
                      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: selected ? typeMeta.color : 'var(--text)' }}>{v.name}</span>
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                          background: v.gender === 'W' ? '#FDE8EE' : '#E8EEFB',
                          color: v.gender === 'W' ? '#C4366A' : '#3A5BC7',
                        }}>{v.gender === 'W' ? '♀' : '♂'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{v.desc}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>→ {v.best}</div>
                    </div>
                  )
                })}
              </div>
            </Section>

            {/* ═══ SPEED & TEMPERATURE ═══ */}
            <Section icon="⚙️" title="Geschwindigkeit & Temperatur" desc="Wie schnell und kreativ Ihr Agent spricht">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                <SliderField label="Geschwindigkeit" value={config.speed || 1.0} min={0.7} max={1.3} step={0.05} display={`${(config.speed || 1.0).toFixed(2)}×`} onChange={(v: number) => upd('speed', v)} leftLabel="Langsam" rightLabel="Schnell" />
                <SliderField label="Temperatur" value={config.temperature || 0.6} min={0} max={1} step={0.05} display={(config.temperature || 0.6).toFixed(2)} onChange={(v: number) => upd('temperature', v)} leftLabel="Konsistent" rightLabel="Kreativ" />
              </div>
            </Section>

            {/* ═══ STT-LLM-TTS SPECIFIC: LLM Model ═══ */}
            {agentType === 'stt-llm-tts' && (
              <Section icon="🧠" title="LLM & STT Einstellungen" desc="Spracherkennung und Sprachmodell konfigurieren">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <FieldLabel label="LLM Modell">
                    <select value={config.llm_model || 'gpt-4.1-mini'} onChange={e => upd('llm_model', e.target.value)}
                      style={{ ...inp, cursor: 'pointer' }}>
                      <option value="gpt-4.1-mini">GPT-4.1 Mini (schnell, günstig)</option>
                      <option value="gpt-4.1">GPT-4.1 (ausgewogen)</option>
                      <option value="gpt-4o">GPT-4o (langsamer, intelligenter)</option>
                    </select>
                  </FieldLabel>
                  <FieldLabel label="STT Sprache">
                    <select value={config.stt_language || 'de'} onChange={e => upd('stt_language', e.target.value)}
                      style={{ ...inp, cursor: 'pointer' }}>
                      <option value="de">🇩🇪 Deutsch</option>
                      <option value="en">🇬🇧 Englisch</option>
                      <option value="multi">🌍 Multilingual (Auto-Erkennung)</option>
                    </select>
                  </FieldLabel>
                  <FieldLabel label="TTS Geschwindigkeit">
                    <SliderField label="" value={config.tts_speed || 1.05} min={0.8} max={1.3} step={0.05} display={`${(config.tts_speed || 1.05).toFixed(2)}×`} onChange={(v: number) => upd('tts_speed', v)} leftLabel="Langsam" rightLabel="Schnell" />
                  </FieldLabel>
                </div>
              </Section>
            )}

            {/* ═══ PERSÖNLICHKEIT ═══ */}
            <Section icon="💬" title="Persönlichkeit & Verhalten" desc="Charakter und häufige Fragen definieren">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <FieldLabel label="Charakterbeschreibung">
                  <textarea style={ta} value={config.prompt_sections?.persoenlichkeit || ''} onChange={e => updSection('persoenlichkeit', e.target.value)} rows={3} placeholder="Beschreiben Sie den Charakter: freundlich, professionell, immer per Sie..." />
                </FieldLabel>
                <FieldLabel label="Häufige Fragen & Antworten">
                  <textarea style={ta} value={config.prompt_sections?.haeufige_fragen || ''} onChange={e => updSection('haeufige_fragen', e.target.value)} rows={4} placeholder="Q: Wie sind Ihre Öffnungszeiten? A: Mo-Fr 9-17 Uhr..." />
                </FieldLabel>
                <FieldLabel label="Firmeninformationen">
                  <textarea style={ta} value={config.prompt_sections?.firmeninfo || ''} onChange={e => updSection('firmeninfo', e.target.value)} rows={3} placeholder="Informationen über Ihr Unternehmen, Produkte, Services..." />
                </FieldLabel>
              </div>
            </Section>

            {/* ═══ DICTIONARY ═══ */}
            <Section icon="📖" title="Aussprache-Wörterbuch" desc="Firmennamen und Fachbegriffe korrekt aussprechen">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dictEntries.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface2)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                    Noch keine Einträge — fügen Sie Begriffe hinzu
                  </div>
                )}
                {dictEntries.map(([term, pron]) => (
                  <div key={term} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 14px', background: 'var(--surface2)',
                    borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                    animation: 'fadeIn 0.2s ease',
                  }}>
                    <span style={{ flex: 1, fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{term}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                      <span style={{ color: 'var(--purple)', fontWeight: 500 }}>{pron as string}</span>
                    </span>
                    <button onClick={() => removeDictEntry(term)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: '2px 6px', borderRadius: 4, transition: 'all 0.12s', lineHeight: 1 }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = '#DC2626'; (e.target as HTMLElement).style.background = 'var(--danger-bg)' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text-muted)'; (e.target as HTMLElement).style.background = 'none' }}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input value={newTerm} onChange={e => setNewTerm(e.target.value)} placeholder="Begriff" style={{ ...inp, flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDictEntry() } }} />
                <input value={newPron} onChange={e => setNewPron(e.target.value)} placeholder="Aussprache" style={{ ...inp, flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDictEntry() } }} />
                <button onClick={addDictEntry}
                  style={{ padding: '0 16px', borderRadius: 'var(--radius)', border: '1.5px solid var(--purple)', background: 'var(--purple-light)', color: 'var(--purple)', fontWeight: 700, cursor: 'pointer', fontSize: 17, fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--purple-mid)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--purple-light)' }}>+</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                {dictEntries.length} {dictEntries.length === 1 ? 'Eintrag' : 'Einträge'} · Enter oder + zum Hinzufügen
              </div>
            </Section>
          </div>
        </div>

        {/* ═══ RIGHT: DEPLOY PANEL ═══ */}
        <div style={{
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          position: isMobile ? 'relative' as any : 'sticky', top: isMobile ? undefined : 0, height: isMobile ? 'auto' : '100vh', overflowY: 'auto',
        }}>
          <div style={{ padding: isMobile ? '14px 16px' : '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Deployment</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Änderungen live schalten</div>
          </div>

          <div style={{ padding: isMobile ? '14px 16px' : '18px 22px', flex: 1 }}>
            {/* Status Card */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Konfiguration</div>
              {[
                ['Agent', config.agent_persona_name || agentId],
                ['Typ', typeMeta.label],
                ['Stimme', voiceCatalog.find(v => v.id === currentVoiceId)?.name || '—'],
                ['Service', config.service_name || '—'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>Aktiv</span>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <button onClick={handleDeploy} disabled={deploying}
              style={{
                width: '100%', padding: '12px', marginBottom: 10, border: 'none',
                borderRadius: 'var(--radius)', color: 'white', fontSize: 13, fontWeight: 700,
                cursor: deploying ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                transition: 'all 0.2s', letterSpacing: '0.02em',
                background: deployDone ? 'var(--success)' : deployError ? 'var(--danger)' : deploying ? 'var(--text-muted)' : 'var(--purple)',
                boxShadow: deploying || deployDone || deployError ? 'none' : 'var(--shadow-purple)',
              }}>
              {deploying ? '⟳ Deploying...' : deployDone ? '✓ Erfolgreich deployed' : deployError ? '✕ Fehler — nochmal?' : '🚀 Jetzt deployen'}
            </button>

            <div style={{ padding: '9px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>Backup → Config → Syntax → Restart (~5s)</div>
            </div>

            {/* Deploy Log */}
            {deployLog.length > 0 && (
              <div style={{ background: '#0C0F1A', borderRadius: 'var(--radius)', padding: '12px 14px', overflow: 'auto', maxHeight: 200, marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#3B4064', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Log</div>
                {deployLog.map((line, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, lineHeight: 1.7, color: line.startsWith('✓') ? '#4ADE80' : line.startsWith('✕') ? '#F87171' : '#64748B' }}>{line}</div>
                ))}
                {deploying && <div style={{ width: 7, height: 12, background: 'var(--purple)', animation: 'pulse 0.8s infinite', display: 'inline-block', borderRadius: 1 }} />}
              </div>
            )}

            {/* Deploy History */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div onClick={() => setShowHistory(!showHistory)}
                style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showHistory ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Deploy-Historie ({deployHistory.length})</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showHistory ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block' }}>▼</span>
              </div>
              {showHistory && (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  {deployHistory.length === 0 ? (
                    <div style={{ padding: '18px 14px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>Noch keine Deploys</div>
                  ) : deployHistory.map((d: any, i: number) => (
                    <div key={i} style={{ padding: '9px 14px', borderBottom: i < deployHistory.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>#{deployHistory.length - i}</span>
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700,
                          background: d.status === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                          color: d.status === 'success' ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {d.status === 'success' ? '✓' : '✕'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.date || d.deployed_at || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ COMPONENTS ═══ */
function Section({ icon, title, desc, children }: { icon: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }} className="animate-in">
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)' }}>
        <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
        </div>
      </div>
      <div style={{ padding: '18px' }}>{children}</div>
    </div>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      {children}
    </div>
  )
}

function SliderField({ label, value, min, max, step, display, onChange, leftLabel, rightLabel }: any) {
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
          <div style={{ padding: '3px 10px', background: 'var(--purple-light)', border: '1px solid var(--purple-mid)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)' }}>{display}</div>
        </div>
      )}
      <input type="range" min={min * 100} max={max * 100} value={Math.round(value * 100)} step={step * 100} onChange={e => onChange(parseFloat((parseInt(e.target.value) / 100).toFixed(2)))} style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{leftLabel}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rightLabel}</span>
      </div>
    </div>
  )
}

