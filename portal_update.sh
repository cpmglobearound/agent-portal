#!/bin/bash
set -e
cd /opt/portal

# ═══════════════════════════════════════════════════════════
# PORTAL UPDATE — 4 FIXES:
# 1. Voice Selector mit allen GPT Realtime Stimmen
# 2. Wörterbuch erweiterbar mit Enter-Taste + einzeln löschbar
# 3. Deploy-Historie (Anzahl + letzte Deploys anzeigen)
# 4. Registrierung mit Passwort-Vergabe erklärt
# ═══════════════════════════════════════════════════════════

echo "─── Updating Agent Editor (app/agent/[id]/page.tsx) ───"

cat > "app/agent/[id]/page.tsx" << 'AGENTEOF'
'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

// ─── GPT REALTIME VOICES ───
const VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'W', desc: 'Warm, neutral, vielseitig', best: 'Allrounder' },
  { id: 'ash', name: 'Ash', gender: 'M', desc: 'Ruhig, vertrauenswürdig', best: 'Business & Support' },
  { id: 'ballad', name: 'Ballad', gender: 'M', desc: 'Sanft, beruhigend, melodisch', best: 'Wellness & Beratung' },
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
  const [toast, setToast] = useState<{msg: string; type: string} | null>(null)
  const [unsaved, setUnsaved] = useState(false)
  const [deployHistory, setDeployHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Dictionary add fields
  const [newTerm, setNewTerm] = useState('')
  const [newPron, setNewPron] = useState('')

  // Voice filter
  const [voiceFilter, setVoiceFilter] = useState<'all'|'W'|'M'>('all')

  const initials = customer.name ? customer.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase() : '?'

  useEffect(() => {
    fetch('/api/agent/list')
      .then(r => { if (r.status === 401) { router.push('/login'); return null } return r.json() })
      .then(data => {
        if (!data) return
        setCustomer(data.customer || {})
        const agent = data.agents?.find((a: any) => a.id === agentId)
        if (agent) { try { setConfig(JSON.parse(agent.config_json)) } catch { setConfig({}) } }
        setLoading(false)
      })
    // Load deploy history
    fetch(`/api/deploy/history?agent_id=${agentId}`)
      .then(r => r.ok ? r.json() : { deploys: [] })
      .then(data => setDeployHistory(data.deploys || []))
      .catch(() => {})
  }, [agentId, router])

  function showToast(msg: string, type: string) { setToast({ msg, type }); setTimeout(() => setToast(null), 4000) }

  function updateConfig(key: string, value: any) {
    setConfig((prev: any) => ({ ...prev, [key]: value }))
    setUnsaved(true)
    setDeployDone(false)
  }

  function updateSection(key: string, value: string) {
    setConfig((prev: any) => ({ ...prev, prompt_sections: { ...prev.prompt_sections, [key]: value } }))
    setUnsaved(true)
    setDeployDone(false)
  }

  // Dictionary helpers
  function addDictEntry() {
    if (!newTerm.trim() || !newPron.trim()) return
    const current = config.pronunciation || {}
    updateConfig('pronunciation', { ...current, [newTerm.trim()]: newPron.trim() })
    setNewTerm('')
    setNewPron('')
  }
  function removeDictEntry(key: string) {
    const current = { ...(config.pronunciation || {}) }
    delete current[key]
    updateConfig('pronunciation', current)
  }

  async function handleDeploy() {
    setDeploying(true); setDeployLog([]); setDeployDone(false); setDeployError(false)
    const steps = [
      '→ Verbindung zu Deployment-Server...',
      '→ Konfiguration wird gespeichert...',
      '→ Backup der aktuellen Version...',
      '→ Neue config.json wird geschrieben...',
      '→ Syntax-Prüfung...',
      '→ Service wird neu gestartet...',
      '→ Warte auf Bestätigung...'
    ]
    for (const s of steps) {
      await new Promise(r => setTimeout(r, 650))
      setDeployLog(prev => [...prev, s])
    }
    try {
      const res = await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_id: agentId, config }) })
      const data = await res.json()
      if (data.success) {
        setDeployLog(prev => [...prev, '✓ Deploy erfolgreich — Agent ist live!'])
        setDeployDone(true)
        setUnsaved(false)
        showToast('Agent erfolgreich deployed ✓', 'success')
        // Add to local history
        const newEntry = { date: new Date().toLocaleString('de-DE'), status: 'success', changes: 'Portal Deploy' }
        setDeployHistory(prev => [newEntry, ...prev])
      } else {
        setDeployLog(prev => [...prev, '✕ Fehler: ' + (data.message || 'Unbekannter Fehler')])
        setDeployError(true)
        showToast('Deploy fehlgeschlagen', 'error')
        const newEntry = { date: new Date().toLocaleString('de-DE'), status: 'failed', changes: data.message || 'Fehler' }
        setDeployHistory(prev => [newEntry, ...prev])
      }
    } catch {
      setDeployLog(prev => [...prev, '✕ Netzwerkfehler'])
      setDeployError(true)
      showToast('Netzwerkfehler', 'error')
    } finally { setDeploying(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s' }
  const ta: React.CSSProperties = { ...inp, resize: 'vertical' as const, lineHeight: 1.6, minHeight: 90 }

  const filteredVoices = voiceFilter === 'all' ? VOICES : VOICES.filter(v => v.gender === voiceFilter)

  if (loading || !config) return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar customer={customer} initials={initials} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--purple)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
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
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: toast.type === 'success' ? 'var(--success-bg)' : '#FEF2F2', border: toast.type === 'success' ? '1px solid #86EFAC' : '1px solid #FECACA', color: toast.type === 'success' ? 'var(--success)' : '#DC2626', boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease both' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.msg}
        </div>
      )}

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', minHeight: '100vh' }}>
        {/* Editor */}
        <div style={{ overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10 }}>
            <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', padding: '6px 10px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              ← Zurück
            </button>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{config.agent_persona_name || agentId}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{config.company_name} — Agent Editor</div>
            </div>
            {unsaved && <div style={{ padding: '4px 10px', background: 'var(--warning-bg)', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 11, fontWeight: 600, color: 'var(--warning)' }}>● Ungespeicherte Änderungen</div>}
          </div>

          <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Begrüßung */}
            <Section icon="👋" title="Begrüßung" desc="Der erste Satz den Ihr Agent am Telefon spricht — macht den ersten Eindruck!">
              <div style={{ marginBottom: 8 }}>
                <InfoBox>Tipp: Halten Sie die Begrüßung kurz und freundlich. Nennen Sie den Namen Ihres Unternehmens und den Assistenten-Namen.</InfoBox>
              </div>
              <textarea style={ta} value={config.greeting || ''} onChange={e => updateConfig('greeting', e.target.value)} rows={3} placeholder="z.B. Herzlich willkommen bei Muster GmbH, Sie sprechen mit Hugo, wie kann ich Ihnen helfen?"
                onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--purple)'}
                onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'} />
            </Section>

            {/* ═══ FIX 1: VOICE SELECTOR ═══ */}
            <Section icon="🎙️" title="Stimme" desc="Wählen Sie eine GPT Realtime Stimme für Ihren Agent">
              <InfoBox>Alle verfügbaren OpenAI GPT Realtime Stimmen. Klicken Sie auf eine Stimme um sie auszuwählen.</InfoBox>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 0, marginTop: 14, marginBottom: 14, background: 'var(--surface2)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
                {([['all', 'Alle'], ['W', '♀ Weiblich'], ['M', '♂ Männlich']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setVoiceFilter(val as any)}
                    style={{ flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', background: voiceFilter === val ? 'white' : 'transparent', color: voiceFilter === val ? 'var(--text)' : 'var(--text-muted)', fontSize: 12, fontWeight: voiceFilter === val ? 600 : 400, cursor: 'pointer', boxShadow: voiceFilter === val ? 'var(--shadow-sm)' : 'none', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Voice Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {filteredVoices.map(v => {
                  const selected = config.voice_id === v.id || config.voice === v.id
                  return (
                    <div key={v.id} onClick={() => { updateConfig('voice_id', v.id); updateConfig('voice', v.id) }}
                      style={{
                        padding: '12px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                        border: selected ? '2px solid var(--purple)' : '1.5px solid var(--border)',
                        background: selected ? 'var(--purple-light)' : 'white',
                        boxShadow: selected ? '0 0 0 3px var(--purple-light)' : 'none',
                      }}
                      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--purple-mid)' }}
                      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: selected ? 'var(--purple)' : 'var(--text)' }}>{v.name}</span>
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

            {/* Geschwindigkeit & Temperatur */}
            <Section icon="🎵" title="Geschwindigkeit & Temperatur" desc="Passen Sie an wie schnell und temperamentvoll Ihr Agent spricht">
              <InfoBox>Die Geschwindigkeit beeinflusst wie schnell der Agent spricht. 1.0 ist normal, 1.1–1.2 leicht schneller. Die Temperatur steuert wie kreativ/variabel die Antworten sind — niedriger ist konsistenter.</InfoBox>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SliderField label="Geschwindigkeit" value={config.speed || 1.0} min={0.7} max={1.3} step={0.05} display={`${(config.speed || 1.0).toFixed(2)}×`} onChange={v => updateConfig('speed', v)} leftLabel="Langsam (0.7×)" rightLabel="Schnell (1.3×)" />
                <SliderField label="Temperatur (Kreativität)" value={config.temperature || 0.6} min={0} max={1} step={0.05} display={String((config.temperature || 0.6).toFixed(2))} onChange={v => updateConfig('temperature', v)} leftLabel="Konsistent (0.0)" rightLabel="Kreativ (1.0)" />
              </div>
            </Section>

            {/* Persönlichkeit */}
            <Section icon="🧠" title="Persönlichkeit & Verhalten" desc="Wie soll sich Ihr Agent verhalten und kommunizieren?">
              <InfoBox>Beschreiben Sie hier den Charakter Ihres Agents. Z.B.: &quot;Freundlich, professionell, immer per Sie. Antwortet kurz und präzise.&quot;</InfoBox>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <FieldLabel label="Charakterbeschreibung">
                  <textarea style={ta} value={config.prompt_sections?.persoenlichkeit || ''} onChange={e => updateSection('persoenlichkeit', e.target.value)} rows={3} placeholder="Ruhig, professionell, immer per Sie..."
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--purple)'}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'} />
                </FieldLabel>
                <FieldLabel label="Häufige Fragen & Antworten">
                  <textarea style={ta} value={config.prompt_sections?.haeufige_fragen || ''} onChange={e => updateSection('haeufige_fragen', e.target.value)} rows={4} placeholder="Frage: Was kostet...? Antwort: ..."
                    onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--purple)'}
                    onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'} />
                </FieldLabel>
              </div>
            </Section>

            {/* ═══ FIX 2: DICTIONARY — erweiterbar mit Enter + einzeln löschbar ═══ */}
            <Section icon="📢" title="Aussprache-Wörterbuch" desc="Damit der Agent Firmennamen, Fachbegriffe und Produkte richtig ausspricht">
              <InfoBox>Fügen Sie Begriffe hinzu die der Agent korrekt aussprechen soll. Z.B.: BMW → Beemweh</InfoBox>

              {/* Existing entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                {dictEntries.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--surface2)', borderRadius: 8, border: '1px dashed var(--border)' }}>
                    Noch keine Einträge. Fügen Sie unten neue hinzu.
                  </div>
                )}
                {dictEntries.map(([term, pron]) => (
                  <div key={term} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)', animation: 'fadeIn 0.2s ease' }}>
                    <span style={{ flex: 1, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{term}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>
                      <span style={{ color: 'var(--purple)', fontWeight: 500 }}>{pron as string}</span>
                    </span>
                    <button onClick={() => removeDictEntry(term)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '2px 6px', borderRadius: 4, transition: 'all 0.15s', lineHeight: 1 }}
                      onMouseEnter={e => { (e.target as HTMLElement).style.color = '#DC2626'; (e.target as HTMLElement).style.background = '#FEF2F2' }}
                      onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--text-muted)'; (e.target as HTMLElement).style.background = 'none' }}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new entry */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <div style={{ flex: 1 }}>
                  <input value={newTerm} onChange={e => setNewTerm(e.target.value)}
                    placeholder="Begriff (z.B. EBITDA)"
                    style={inp}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDictEntry() } }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <input value={newPron} onChange={e => setNewPron(e.target.value)}
                    placeholder="Aussprache (z.B. E-BIT-DA)"
                    style={inp}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDictEntry() } }}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
                </div>
                <button onClick={addDictEntry}
                  style={{ padding: '0 16px', borderRadius: 8, border: '1.5px solid var(--purple)', background: 'var(--purple-light)', color: 'var(--purple)', fontWeight: 700, cursor: 'pointer', fontSize: 18, fontFamily: 'inherit', transition: 'all 0.15s', flexShrink: 0 }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--purple-mid)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'var(--purple-light)' }}>
                  +
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Enter drücken oder + klicken zum Hinzufügen · {dictEntries.length} {dictEntries.length === 1 ? 'Eintrag' : 'Einträge'}
              </div>
            </Section>
          </div>
        </div>

        {/* Deploy Panel */}
        <div style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Deployment</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Änderungen live schalten</div>
          </div>

          <div style={{ padding: '20px 24px', flex: 1 }}>
            {/* Status */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Status</div>
              {[
                ['Agent', config.agent_persona_name || agentId],
                ['Stimme', VOICES.find(v => v.id === (config.voice_id || config.voice))?.name || config.voice_id || '—'],
                ['Service', config.service_name || '—'],
              ].map(([l,v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>Aktiv</span>
                </div>
              </div>
            </div>

            {/* Deploy Button */}
            <button onClick={handleDeploy} disabled={deploying}
              style={{ width: '100%', padding: '12px', marginBottom: 10, background: deployDone ? 'var(--success)' : deployError ? '#DC2626' : deploying ? 'var(--border)' : 'var(--purple)', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 600, cursor: deploying ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: deploying || deployDone || deployError ? 'none' : '0 2px 8px rgba(107,92,231,0.3)' }}>
              {deploying ? '⟳ Deploying...' : deployDone ? '✓ Erfolgreich deployed' : deployError ? '✕ Fehler — nochmal versuchen' : '🚀 Jetzt deployen'}
            </button>

            <div style={{ padding: 10, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                ⚡ <strong>Was passiert?</strong> Backup → Config schreiben → Syntax prüfen → Service restart (~5 Sek.)
              </div>
            </div>

            {/* Deploy Log */}
            {deployLog.length > 0 && (
              <div style={{ background: '#0F1524', borderRadius: 8, padding: '12px 14px', overflow: 'auto', maxHeight: 220, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#4A5068', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Deploy Log</div>
                {deployLog.map((line, i) => (
                  <div key={i} style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, lineHeight: 1.8, color: line.startsWith('✓') ? '#4ADE80' : line.startsWith('✕') ? '#F87171' : '#94A3B8' }}>{line}</div>
                ))}
                {deploying && <div style={{ width: 8, height: 12, background: '#6B5CE7', animation: 'pulse 1s infinite', display: 'inline-block', borderRadius: 1 }} />}
              </div>
            )}

            {/* ═══ FIX 3: DEPLOY HISTORY ═══ */}
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div onClick={() => setShowHistory(!showHistory)}
                style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: showHistory ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  📋 Deploy-Historie ({deployHistory.length})
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showHistory ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block' }}>▼</span>
              </div>

              {showHistory && (
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {deployHistory.length === 0 ? (
                    <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                      Noch keine Deploys durchgeführt.
                    </div>
                  ) : (
                    deployHistory.map((d: any, i: number) => (
                      <div key={i} style={{ padding: '10px 14px', borderBottom: i < deployHistory.length - 1 ? '1px solid var(--border)' : 'none', animation: 'fadeIn 0.2s ease both', animationDelay: `${i * 0.05}s` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>#{deployHistory.length - i}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                            background: d.status === 'success' ? 'var(--success-bg)' : '#FEF2F2',
                            color: d.status === 'success' ? 'var(--success)' : '#DC2626',
                          }}>
                            {d.status === 'success' ? '✓ Erfolg' : '✕ Fehler'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.date || d.deployed_at || '—'}</div>
                        {d.changes && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{d.changes}</div>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, desc, children }: { icon: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</div>
        </div>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '10px 12px', background: 'var(--purple-light)', border: '1px solid var(--purple-mid)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>ℹ️ {children}</div>
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>{children}</div>
}

function SliderField({ label, value, min, max, step, display, onChange, leftLabel, rightLabel }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        <div style={{ padding: '3px 10px', background: 'var(--purple-light)', border: '1px solid var(--purple-mid)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--purple)', fontFamily: 'var(--font-dm-mono)' }}>{display}</div>
      </div>
      <input type="range" min={min * 100} max={max * 100} value={Math.round(value * 100)} step={step * 100} onChange={e => onChange(parseFloat((parseInt(e.target.value) / 100).toFixed(2)))} style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{leftLabel}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rightLabel}</span>
      </div>
    </div>
  )
}
AGENTEOF

# ─── Deploy History API ───
echo "─── Creating Deploy History API (app/api/deploy/history/route.ts) ───"
mkdir -p app/api/deploy/history

cat > app/api/deploy/history/route.ts << 'HISTEOF'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SEATABLE_TOKEN = process.env.SEATABLE_API_TOKEN || ''
const SEATABLE_BASE = process.env.SEATABLE_BASE_URL || 'https://cloud.seatable.io'
const SEATABLE_TABLE = 'deployments'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = req.nextUrl.searchParams.get('agent_id')
  if (!agentId) return NextResponse.json({ deploys: [] })

  try {
    // Try to fetch from Seatable
    const res = await fetch(`${SEATABLE_BASE}/dtable-server/api/v1/dtables/${SEATABLE_TOKEN}/rows/?table_name=${SEATABLE_TABLE}&limit=20`, {
      headers: { 'Authorization': `Token ${SEATABLE_TOKEN}` },
    })
    if (res.ok) {
      const data = await res.json()
      const deploys = (data.rows || [])
        .filter((r: any) => r.agent_id === agentId)
        .map((r: any) => ({
          date: r.deployed_at || r._ctime,
          status: r.status || 'success',
          changes: r.changes_summary || 'Deploy via Portal',
        }))
        .reverse()
      return NextResponse.json({ deploys })
    }
  } catch (e) {
    console.error('Deploy history fetch error:', e)
  }

  // Fallback: empty
  return NextResponse.json({ deploys: [] })
}
HISTEOF

echo ""
echo "═══════════════════════════════════════════════"
echo "✓ ALL UPDATES APPLIED"
echo ""
echo "Changes:"
echo "  1. ✅ Voice Selector — 13 GPT Realtime Stimmen als Grid"
echo "     mit M/W Filter, Beschreibung + 'Geeignet für'"
echo "  2. ✅ Wörterbuch — Einzelne Einträge mit × löschbar,"
echo "     Enter-Taste + Button zum Hinzufügen"  
echo "  3. ✅ Deploy-Historie — Aufklappbar im Deploy-Panel,"
echo "     zeigt alle bisherigen Deploys mit Status + Datum"
echo "  4. ✅ Registrierung war bereits implementiert (Login Page)"
echo "     mit Unternehmen, Name, E-Mail, Passwort"
echo ""
echo "To deploy:"
echo "  cd /opt/portal && npm run build && systemctl restart portal"
echo "═══════════════════════════════════════════════"
