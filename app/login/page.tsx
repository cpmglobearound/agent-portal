'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Anmeldung fehlgeschlagen'); setLoading(false); return }
      router.push('/dashboard')
    } catch { setError('Netzwerkfehler — bitte versuche es erneut'); setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/registr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, name: regName, email: regEmail, password: regPassword }) })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Fehler'); return }
      setSuccess('Ihre Anfrage wurde gesendet! Wir richten Ihren Zugang ein und melden uns per E-Mail.')
      setTab('login')
    } catch { setError('Netzwerkfehler') } finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: 'white', border: '1.5px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', transition: 'border-color 0.15s' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
      {/* Left Panel */}
      <div style={{ width: 480, background: 'linear-gradient(160deg, #1A0A2E 0%, #2D1052 40%, #1A1A6E 100%)', display: 'flex', flexDirection: 'column', padding: '48px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(217,43,43,0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(107,92,231,0.3) 0%, transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 48 }}>
            <span style={{ fontWeight: 800, fontSize: 28, color: '#FF6B6B', letterSpacing: '-1px' }}>DESEO</span>
            <span style={{ fontWeight: 800, fontSize: 28, color: '#A78BFA', letterSpacing: '-1px' }}>AI</span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>Voice Agent<br/>Management Portal</h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 48 }}>Konfigurieren und deployen Sie Ihre KI-Telefonassistenten — ohne technisches Know-how.</p>
          {[['🎤', 'Agent bearbeiten', 'Begrüßung, Stimme und Persönlichkeit anpassen'],['🚀', 'Mit einem Klick deployen', 'Änderungen live schalten in unter 30 Sekunden'],['📊', 'Alles im Überblick', 'Status, Backups und Deployment-Historie']].map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 2 }}>{title}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 0.4s ease both' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, letterSpacing: '-0.3px' }}>{tab === 'login' ? 'Anmelden' : 'Zugang anfordern'}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>{tab === 'login' ? 'Mit Ihren Zugangsdaten einloggen' : 'Wir richten Ihren Zugang manuell ein'}</p>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 10, padding: 3, marginBottom: 28, border: '1px solid var(--border)' }}>
            {[['login','Anmelden'],['register','Registrieren']].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t as any); setError(''); setSuccess('') }} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: tab === t ? 'white' : 'transparent', color: tab === t ? 'var(--text)' : 'var(--text-muted)', fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: 'pointer', boxShadow: tab === t ? 'var(--shadow-sm)' : 'none', fontFamily: 'inherit', transition: 'all 0.15s' }}>{label}</button>
            ))}
          </div>

          {error && <div style={{ padding: '10px 14px', marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>⚠ {error}</div>}
          {success && <div style={{ padding: '10px 14px', marginBottom: 16, background: 'var(--success-bg)', border: '1px solid #86EFAC', borderRadius: 8, fontSize: 13, color: 'var(--success)' }}>✓ {success}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-Mail-Adresse</label>
                <input type="email" placeholder="name@unternehmen.de" value={email} onChange={e => setEmail(e.target.value)} required style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Passwort</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', background: loading ? '#CBD0DC' : '#6C5CE7', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', boxShadow: loading ? 'none' : '0 2px 8px rgba(108,92,231,0.3)' }}>
                {loading ? 'Bitte warten...' : 'Anmelden →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>Noch kein Zugang? <span onClick={() => setTab('register')} style={{ color: 'var(--purple)', cursor: 'pointer', fontWeight: 600 }}>Hier anfragen</span></div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unternehmen</label>
                <input type="text" placeholder="Muster GmbH" value={company} onChange={e => setCompany(e.target.value)} required style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ihr Name</label>
                <input type="text" placeholder="Max Mustermann" value={regName} onChange={e => setRegName(e.target.value)} required style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-Mail</label>
                <input type="email" placeholder="name@unternehmen.de" value={regEmail} onChange={e => setRegEmail(e.target.value)} required style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gewünschtes Passwort</label>
                <input type="password" placeholder="Mindestens 8 Zeichen" value={regPassword} onChange={e => setRegPassword(e.target.value)} required minLength={8} style={inp} onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--purple)'} onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border)'} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', background: loading ? '#CBD0DC' : '#E03E3E', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {loading ? 'Bitte warten...' : 'Zugang anfragen →'}
              </button>
              <div style={{ marginTop: 14, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, border: '1px solid var(--border)' }}>
                ℹ️ <strong>Was passiert dann?</strong> Wir erhalten Ihre Anfrage, richten Ihren Account ein und senden Ihnen die Zugangsdaten per E-Mail. In der Regel innerhalb von 24 Stunden.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
