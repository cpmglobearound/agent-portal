# Deseo AI Portal - Setup & Dokumentation

## Übersicht

Das Deseo AI Portal ist ein Next.js-basiertes Web-Dashboard für die Verwaltung von LiveKit Voice Agents.

## Technologie Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **React:** 19.2.3
- **Authentication:** NextAuth.js 4.24.13
- **UI:** Tailwind CSS + Shadcn UI + Radix UI
- **Node.js:** Production Mode
- **Port:** 3000

## Features

### Dashboard
- Übersicht aller LiveKit Agents
- Agent-Status und Monitoring
- Quota-Verwaltung

### Agent Management
- Liste aller konfigurierten Agents
- Detailansicht pro Agent
- Score-Tracking und Auswertung

### Deployment
- Agent-Deployment über N8N Webhook
- Deployment-Historie
- Automatische Backups

### API Endpoints

- `/api/agent/list` - Liste aller Agents
- `/api/agent/[id]` - Agent Details
- `/api/scores` - Score-Daten
- `/api/quota` - Quota-Informationen
- `/api/deploy` - Deployment-Trigger
- `/api/deploy/history` - Deployment-Historie
- `/api/auth/*` - Authentication (Login, Logout, Register)

## Installation & Setup

### 1. Verzeichnis erstellen
```bash
mkdir -p /opt/portal
cd /opt/portal
```

### 2. Repository klonen
```bash
# Dateien aus diesem Repo kopieren
cp -r deseo-portal/* /opt/portal/
```

### 3. Dependencies installieren
```bash
npm install
```

### 4. Environment Variables konfigurieren

Erstelle `/opt/portal/.env.local`:

```env
# SeaTable API Tokens
SEATABLE_CUSTOMERS_TOKEN=your_customers_token
SEATABLE_AGENTS_TOKEN=your_agents_token
SEATABLE_BACKUPS_TOKEN=your_backups_token
SEATABLE_DEPLOYMENTS_TOKEN=your_deployments_token

# SeaTable Base UUIDs
SEATABLE_UUID_CUSTOMERS=your_customers_uuid
SEATABLE_UUID_AGENTS=your_agents_uuid
SEATABLE_UUID_BACKUPS=your_backups_uuid
SEATABLE_UUID_DEPLOYMENTS=your_deployments_uuid

# N8N Webhook URL
N8N_DEPLOY_URL=https://n8n-hetzner.deseoai.com/webhook/agent-deploy

# NextAuth Configuration
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=https://portal.deseoai.com
```

### 5. Build für Production
```bash
npm run build
```

### 6. Systemd Service einrichten

Kopiere die Service-Datei:
```bash
cp systemd-services/portal.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable portal.service
systemctl start portal.service
```

### 7. Status prüfen
```bash
systemctl status portal.service
```

## Service-Datei

Der Service ist unter `/etc/systemd/system/portal.service` konfiguriert:

```ini
[Unit]
Description=Deseo AI Portal
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/portal
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=NODE_ENV=production
EnvironmentFile=/opt/portal/.env.local

[Install]
WantedBy=multi-user.target
```

## Entwicklung

### Development Server starten
```bash
npm run dev
```

### Build erstellen
```bash
npm run build
```

### Production starten
```bash
npm start
```

## Projektstruktur

```
/opt/portal/
├── app/                    # Next.js App Router
│   ├── agent/             # Agent-Seiten
│   ├── api/               # API Routes
│   ├── dashboard/         # Dashboard
│   ├── login/             # Login-Seite
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Home Page
├── components/            # React Komponenten
│   ├── Sidebar.tsx        # Navigation
│   ├── agent-quota.tsx    # Quota Widget
│   └── agent-scores.tsx   # Scores Widget
├── lib/                   # Utilities
│   ├── session.ts         # Session Management
│   └── utils.ts           # Helper Functions
├── public/                # Static Files
├── .env.local            # Environment Variables (NICHT im Repo!)
├── package.json          # Dependencies
└── next.config.ts        # Next.js Config
```

## Integration mit Backend

### SeaTable
Das Portal nutzt SeaTable als Backend-Datenbank für:
- Kunden-Verwaltung
- Agent-Konfigurationen
- Backup-Tracking
- Deployment-Historie

### N8N
Deployments werden über N8N Webhooks getriggert:
- URL: `https://n8n-hetzner.deseoai.com/webhook/agent-deploy`
- Automatische Agent-Updates und Restarts

## Reverse Proxy (Caddy/Nginx)

Das Portal läuft auf Port 3000 und sollte über einen Reverse Proxy erreichbar sein:

```
portal.deseoai.com → localhost:3000
```

## Logs & Debugging

```bash
# Service Logs
journalctl -u portal.service -f

# Port-Check
netstat -tlnp | grep :3000

# Service neustarten
systemctl restart portal.service
```

## Update-Prozess

Das Skript `/opt/portal/portal_update.sh` kann für automatische Updates verwendet werden.

## Wichtige Hinweise

1. **Security:** Die `.env.local` Datei enthält sensible API-Keys und darf NICHT ins Repo!
2. **Node Modules:** `node_modules/` und `.next/` sind nicht im Repo (siehe `.gitignore`)
3. **Port:** Port 3000 muss verfügbar sein
4. **Permissions:** Service läuft als root (anpassen für Production!)

## Support & Wartung

- Service Status: `systemctl status portal.service`
- Service Restart: `systemctl restart portal.service`
- Logs anzeigen: `journalctl -u portal.service -n 100`

## URLs

- Production: https://portal.deseoai.com
- Lokaler Port: http://localhost:3000
