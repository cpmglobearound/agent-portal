# LiveKit Knowledge Base — DeseoAI
> Comprehensive reference: Models · SIP/Telephony · DNS · Config · Tips & Tricks
> Last updated: 2026-06-13 | Source: LiveKit Docs MCP + Production experience

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [AI Models — LLM](#2-ai-models--llm)
3. [AI Models — STT (Speech-to-Text)](#3-ai-models--stt)
4. [AI Models — TTS (Text-to-Speech)](#4-ai-models--tts)
5. [AI Models — Realtime (Speech-to-Speech)](#5-ai-models--realtime)
6. [Pipeline Types](#6-pipeline-types)
7. [Agent Setup — Python Quickstart](#7-agent-setup--python-quickstart)
8. [Telephony / SIP Setup](#8-telephony--sip-setup)
9. [DNS Settings](#9-dns-settings)
10. [Inbound Calls](#10-inbound-calls)
11. [Outbound Calls](#11-outbound-calls)
12. [Turn Detection & Latency Tuning](#12-turn-detection--latency-tuning)
13. [Environment Variables](#13-environment-variables)
14. [LiveKit Inference](#14-livekit-inference)
15. [Deployment](#15-deployment)
16. [Tips & Tricks](#16-tips--tricks)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. Platform Overview

LiveKit = open-source framework + cloud platform für Voice, Video, Physical AI Agents.

**Kernkomponenten:**
- **LiveKit Server**: WebRTC SFU (Selective Forwarding Unit) — selbst hosten oder LiveKit Cloud
- **Agents Framework**: Python + Node.js SDK für AI-Agents mit Deployment-Environment
- **Plugins**: Ecosystem für STT/LLM/TTS-Provider
- **Telephony**: SIP-Integration für PSTN (Phone-Netzwerke)
- **Egress/Ingress**: Recording, Streaming, externe Media-Streams

**URLs:**
- Cloud Dashboard: https://cloud.livekit.io
- Docs: https://docs.livekit.io
- Python SDK: `livekit-agents`
- Node.js SDK: `@livekit/agents`

---

## 2. AI Models — LLM

### LiveKit Inference (direkt über LiveKit Cloud)
```python
from livekit.agents import inference
llm = inference.LLM(model="openai/gpt-5.3-chat-latest")
llm = inference.LLM(model="openai/gpt-5.2-chat-latest")
```

### OpenAI
```python
from livekit.plugins import openai
# Responses API (empfohlen)
llm = openai.responses.LLM(model="gpt-5.3-chat-latest")
# Chat Completions
llm = openai.LLM(model="gpt-4o")
```
**Env:** `OPENAI_API_KEY`

### Anthropic Claude
```python
from livekit.plugins import anthropic
llm = anthropic.LLM(model="claude-sonnet-4-6")
```
**Env:** `ANTHROPIC_API_KEY`
**Install:** `uv add "livekit-agents[anthropic]~=1.5"`

### Google Gemini
```python
from livekit.plugins import google
llm = google.LLM(model="gemini-2.5-pro")
llm = google.LLM(model="gemini-2.5-flash")
```
**Env:** `GOOGLE_API_KEY`
**Install:** `uv add "livekit-agents[google]~=1.5"`

### Groq (ultra-fast inference)
```python
from livekit.plugins import groq
llm = groq.LLM(model="llama-3.3-70b-versatile")
llm = groq.LLM(model="llama-3.1-8b-instant")
```
**Env:** `GROQ_API_KEY`

### DeepSeek
```python
from livekit.plugins import openai
llm = openai.LLM(model="deepseek-chat", base_url="https://api.deepseek.com/v1", api_key=os.getenv("DEEPSEEK_API_KEY"))
```

### xAI Grok
```python
from livekit.plugins import xai
llm = xai.LLM(model="grok-3")
```
**Env:** `XAI_API_KEY`

### Mistral AI
```python
from livekit.plugins import mistral
llm = mistral.LLM(model="mistral-large-latest")
```

### OpenAI-Compatible (beliebiger Provider)
```python
from livekit.plugins import openai
llm = openai.LLM(
    model="model-name",
    base_url="https://api.provider.com/v1",
    api_key=os.getenv("PROVIDER_API_KEY")
)
```

### Ollama (lokal)
```python
from livekit.plugins import openai
llm = openai.LLM(model="llama3.2", base_url="http://localhost:11434/v1", api_key="ollama")
```

### AWS Bedrock
```python
from livekit.plugins import aws
llm = aws.LLM(model="anthropic.claude-3-5-sonnet-20241022-v2:0")
```

### Azure OpenAI
```python
from livekit.plugins import azure
llm = azure.LLM(model="gpt-4o", azure_deployment="my-deployment")
```
**Env:** `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`

### Weitere LLM-Provider
| Provider | Plugin | Model |
|---|---|---|
| Cerebras | `cerebras` | `llama3.1-70b` |
| Fireworks | `fireworks` | diverse Llama/Mistral |
| Together AI | `together` | Llama, Qwen |
| Perplexity | `openai` (compat) | `sonar-pro` |
| OVHCloud | `openai` (compat) | diverse |
| OpenRouter | `openai` (compat) | 500+ Modelle |
| Baseten | `baseten` | custom deployed |
| Telnyx | `telnyx` | integriert |

---

## 3. AI Models — STT

### LiveKit Inference
```python
from livekit.agents import inference
stt = inference.STT(model="deepgram/nova-3", language="en")
stt = inference.STT(model="deepgram/flux-general", language="multi")
```

### Deepgram (empfohlen für DE/EN)
```python
from livekit.plugins import deepgram
stt = deepgram.STT(model="nova-3", language="de")
stt = deepgram.STT(model="nova-3", language="en")
stt = deepgram.STT(model="nova-3", language="multi")  # multilingual
```
**Env:** `DEEPGRAM_API_KEY`
**Install:** `uv add "livekit-agents[deepgram]~=1.5"`

**Deepgram Modelle:**
- `nova-3` — beste Qualität, empfohlen
- `nova-3-medical` — medizinische Terminologie
- `nova-2` — stabil, weit verbreitet
- `enhanced` — älteres Modell

### AssemblyAI
```python
from livekit.plugins import assemblyai
stt = assemblyai.STT(language="de")
```
**Env:** `ASSEMBLYAI_API_KEY`

### ElevenLabs STT
```python
from livekit.plugins import elevenlabs
stt = elevenlabs.STT()
```

### Google Cloud STT
```python
from livekit.plugins import google
stt = google.STT(language="de-DE")
```

### Cartesia STT
```python
from livekit.plugins import cartesia
stt = cartesia.STT()
```

### OpenAI Whisper
```python
from livekit.plugins import openai
stt = openai.STT(model="whisper-1")
```

### Azure AI Speech
```python
from livekit.plugins import azure
stt = azure.STT(language="de-DE")
```

### Weitere STT-Provider
| Provider | Sprache | Besonderheit |
|---|---|---|
| Speechmatics | multilingual | sehr akkurat |
| Groq | en | Whisper v3 ultra-fast |
| Gladia | multilingual | Speaker Diarization |
| Soniox | en, de | Streaming |
| Spitch | DE, CH | DACH-spezialisiert |
| Clova | ko, ja | Asiatische Sprachen |
| NVIDIA Riva | en | On-prem GPU |
| Amazon Transcribe | multilingual | AWS-integriert |

---

## 4. AI Models — TTS

### LiveKit Inference
```python
from livekit.agents import inference
# String-Shorthand mit Voice-ID
tts = inference.TTS(model="cartesia/sonic-3", voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc")
# oder direkt als String:
tts = "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
```

### Cartesia (empfohlen für geringe Latenz)
```python
from livekit.plugins import cartesia
tts = cartesia.TTS(
    model="sonic-3",
    voice="9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",  # Standard-Stimme
    language="de"
)
```
**Env:** `CARTESIA_API_KEY`
**Beste Modelle:** `sonic-3` (neueste), `sonic-2`, `sonic-turbo` (schnell)
**Deutsche Stimmen:** Im Cartesia-Dashboard verfügbar

### ElevenLabs (beste Qualität)
```python
from livekit.plugins import elevenlabs
tts = elevenlabs.TTS(
    voice_id="pNInz6obpgDQGcFmaJgB",  # Adam
    model_id="eleven_multilingual_v2",
    language_code="de"
)
```
**Env:** `ELEVEN_API_KEY`
**Modelle:** `eleven_multilingual_v2`, `eleven_flash_v2_5` (niedrige Latenz), `eleven_turbo_v2`

### OpenAI TTS
```python
from livekit.plugins import openai
tts = openai.TTS(model="gpt-4o-mini-tts", voice="alloy")
```
**Stimmen:** alloy, echo, fable, onyx, nova, shimmer, coral

### Deepgram TTS
```python
from livekit.plugins import deepgram
tts = deepgram.TTS(model="aura-2-en-us")
```

### Google Cloud TTS
```python
from livekit.plugins import google
tts = google.TTS(voice="de-DE-Neural2-A", language_code="de-DE")
```

### Gemini TTS
```python
from livekit.plugins import google
tts = google.TTS(model="gemini-2.5-flash-preview-tts", voice="Kore")
```
**Voices:** Kore, Charon, Fenrir, Aoede, Puck, Orbit, Zephyr

### Azure AI Speech TTS
```python
from livekit.plugins import azure
tts = azure.TTS(voice="de-DE-KatjaNeural")
```
**Deutsche Stimmen:** de-DE-KatjaNeural, de-DE-ConradNeural, de-AT-IngridNeural, de-CH-LeniNeural

### xAI TTS
```python
from livekit.plugins import xai
tts = xai.TTS(voice="hera")
```

### Weitere TTS-Provider
| Provider | Besonderheit |
|---|---|
| Rime | natürliche Prosodie |
| LMNT | ultra-fast streaming |
| Kokoro | lokal/open-source |
| MiniMax | Chinesisch + Multilingual |
| Hume | emotionale Stimmen |
| Murf AI | professionelle Stimmen |
| Amazon Polly | AWS-integriert, Neural |
| Resemble AI | Voice Cloning |
| Speechify | natürliches Vorlesen |

### Custom Voice Cloning (LiveKit Inference)
```python
# Im LiveKit Dashboard: Eigene Voice-Klone aus Audio-Samples erstellen
# Dann verwenden wie normale Voice-ID
tts = inference.TTS(model="cartesia/sonic-3", voice="<custom-voice-id>")
```

---

## 5. AI Models — Realtime (Speech-to-Speech)

### OpenAI Realtime API (empfohlen)
```python
from livekit.plugins import openai
llm = openai.realtime.RealtimeModel(
    model="gpt-4o-realtime-preview",
    voice="coral",  # alloy, coral, sage, shimmer, echo, verse, ballad, ash
    temperature=0.8,
    turn_detection=openai.realtime.ServerVadOptions(
        threshold=0.5,
        silence_duration_ms=500,
    )
)
```
**Env:** `OPENAI_API_KEY`

### Gemini Live API
```python
from livekit.plugins import google
llm = google.beta.realtime.RealtimeModel(
    model="gemini-2.0-flash-live-001",
    voice="Kore",
    api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=1.0,
)
```
**Env:** `GOOGLE_API_KEY`
**Debug:** `LK_GOOGLE_DEBUG=1`
**Turn Detection:** `user_away_timeout` Parameter

### Amazon Nova Sonic
```python
from livekit.plugins import aws
llm = aws.realtime.RealtimeModel()
```

### Azure OpenAI Realtime
```python
from livekit.plugins import azure
llm = azure.realtime.RealtimeModel(
    azure_deployment="gpt-4o-realtime-preview",
    voice="alloy"
)
```

### xAI Grok Voice Agent API
```python
from livekit.plugins import xai
llm = xai.realtime.RealtimeModel(model="grok-3-mini")
```

### Ultravox Realtime
```python
from livekit.plugins import ultravox
llm = ultravox.RealtimeModel(voice="Mark")
```

---

## 6. Pipeline Types

### STT-LLM-TTS Pipeline (Standard)
- Drei getrennte spezialisierte Modelle
- Beste Kontrolle, günstiger
- Latenz: ~800ms-1.5s
- **Empfohlen für:** Komplexe Workflows, Tool Calls, Mehrsprachigkeit

```
Audio → VAD → STT → LLM → TTS → Audio
```

### Realtime (Speech-to-Speech)
- Ein Modell für alles
- Natürlichere Prosodie, emotionaler
- Latenz: ~300-600ms
- Teurer, weniger Kontrolle
- **Empfohlen für:** Natürliche Gespräche, einfache Assistenten

```
Audio → RealtimeModel → Audio
```

### Wann was?

| Kriterium | STT-LLM-TTS | Realtime |
|---|---|---|
| Tool Calls | ✅ sehr gut | ⚠️ eingeschränkt |
| Latenz | ~1s | ~400ms |
| Kosten | günstiger | teurer |
| Mehrsprachigkeit | ✅ | ⚠️ |
| Natürlichkeit | gut | sehr natürlich |
| Kontrolle | voll | weniger |

---

## 7. Agent Setup — Python Quickstart

### Installation
```bash
# Neue Umgebung
uv init my-agent && cd my-agent
uv add "livekit-agents[openai,deepgram,cartesia,silero,turn-detector,noise-cancellation]~=1.5"

# Model-Dateien herunterladen (VAD, Turn-Detector, Noise-Cancellation)
uv run python -m livekit.agents download-files
```

### Minimaler Agent
```python
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent, inference, TurnHandlingOptions
from livekit.plugins import silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv(".env.local")

class MyAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="Du bist ein hilfreicher Assistent. Antworte kurz und präzise auf Deutsch.",
        )

server = AgentServer()

@server.rtc_session(agent_name="my-agent")
async def session(ctx: agents.JobContext):
    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-3", language="de"),
        llm=inference.LLM(model="openai/gpt-5.2-chat-latest"),
        tts=inference.TTS(model="cartesia/sonic-3", voice="<voice-id>"),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )
    await session.start(room=ctx.room, agent=MyAgent())
    await session.generate_reply(instructions="Begrüße den Anrufer auf Deutsch.")

if __name__ == "__main__":
    agents.cli.run_app(server)
```

### .env.local
```env
LIVEKIT_URL=wss://<project-id>.livekit.cloud
LIVEKIT_API_KEY=<api-key>
LIVEKIT_API_SECRET=<api-secret>

# AI Providers
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
ELEVEN_API_KEY=...
GROQ_API_KEY=...
```

### Startup Modi
```bash
# Entwicklung (verbindet sich mit LiveKit Cloud)
uv run agent.py dev

# Terminal-Modus (lokal, ohne Browser)
uv run agent.py console

# Produktion
uv run agent.py start
```

### Agent registrieren + deployen
```bash
# Einmalig registrieren
lk agent create --name my-agent

# Deployen
lk agent deploy --name my-agent
```

---

## 8. Telephony / SIP Setup

### Konzept
```
PSTN (Telefonnetz)
    ↓
SIP Trunk Provider (Telnyx/Twilio/Plivo/etc.)
    ↓ SIP
LiveKit SIP Gateway (<project-id>.sip.livekit.cloud)
    ↓ WebRTC
LiveKit Room → Agent
```

### Supported SIP Providers
| Provider | Inbound | Outbound | Besonderheit |
|---|---|---|---|
| **Telnyx** | ✅ | ✅ | günstig, EU-Nummern |
| **Twilio** | ✅ | ✅ | weit verbreitet |
| **Plivo** | ✅ | ✅ | günstig international |
| **Sinch** | ✅ | ✅ | Europa stark |
| **Wavix** | ✅ | ✅ | |

### SIP URI finden
```bash
# Eigene SIP URI per CLI
lk project list --json
# ProjectId: p_vjnxecm0tjk → SIP URI: vjnxecm0tjk.sip.livekit.cloud
# Vollständig: sip:vjnxecm0tjk.sip.livekit.cloud
```

---

## 9. DNS Settings

### SIP Endpoint (für Provider-Konfiguration)
```
SIP URI:      sip:<project-id>.sip.livekit.cloud
SIP Endpoint: <project-id>.sip.livekit.cloud  (ohne "sip:" Präfix)
Port:         5060 (UDP/TCP) oder 5061 (TLS)
```

### LiveKit Cloud Regions & Endpoints
```
Global (auto-routing): <project-id>.sip.livekit.cloud

Region-spezifisch (für Latenz-Optimierung):
  EU Frankfurt: eu-frankfurt.sip.livekit.cloud
  EU Ireland:   eu-ireland.sip.livekit.cloud
  US East:      us-east.sip.livekit.cloud
  US West:      us-west.sip.livekit.cloud
  AP Singapore: ap-southeast.sip.livekit.cloud
  AP Tokyo:     ap-northeast.sip.livekit.cloud
```

### WebRTC / TURN Server
LiveKit Cloud managed TURN automatisch — keine manuelle DNS-Konfiguration nötig.

### Self-Hosted DNS Setup
```yaml
# docker-compose.yml für self-hosted LiveKit
services:
  livekit:
    image: livekit/livekit-server:latest
    ports:
      - "7880:7880"   # HTTP API
      - "7881:7881"   # RTC (WebRTC)
      - "7882:7882/udp" # TURN/UDP
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml
```

```yaml
# livekit.yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  tcp_port: 7881
```

**DNS Records für Self-Hosting:**
```
A     livekit.example.com     → <server-ip>
A     turn.example.com        → <server-ip>
SRV   _sip._udp.example.com  → livekit.example.com:5060
```

### Telnyx SIP Trunk DNS Setup
```
SIP Connection Hostname: <project-id>.sip.livekit.cloud
Transport: UDP oder TLS
Port: 5060 (UDP) / 5061 (TLS)
```

### Twilio SIP Trunk DNS Setup
```
Origination URI: sip:<project-id>.sip.livekit.cloud
```

### Firewall-Regeln (self-hosted)
```
TCP/UDP 5060    # SIP Signalling
TCP/UDP 5061    # SIP TLS
UDP 10000-60000 # RTP Media
TCP 7880        # LiveKit HTTP API
TCP/UDP 7881    # WebRTC
UDP 3478        # STUN
TCP/UDP 5349    # TURN/TLS
```

---

## 10. Inbound Calls

### Inbound Trunk erstellen
```python
from livekit.protocol import sip as proto_sip
from livekit import api

lk = api.LiveKitAPI(
    url=os.getenv("LIVEKIT_URL"),
    api_key=os.getenv("LIVEKIT_API_KEY"),
    api_secret=os.getenv("LIVEKIT_API_SECRET"),
)

trunk = await lk.sip.create_sip_inbound_trunk(
    proto_sip.CreateSIPInboundTrunkRequest(
        trunk=proto_sip.SIPInboundTrunkInfo(
            name="Mein Inbound Trunk",
            numbers=["+4917612345678"],  # Deine Telefonnummer
            # Optional: Authentifizierung
            auth_username="user",
            auth_password="secret",
        )
    )
)
print(f"Trunk ID: {trunk.sip_trunk_id}")
```

### Dispatch Rule erstellen
```python
# Jeder Anrufer → eigener Room
rule = await lk.sip.create_sip_dispatch_rule(
    proto_sip.CreateSIPDispatchRuleRequest(
        rule=proto_sip.SIPDispatchRule(
            name="Dispatch Rule",
            rule=proto_sip.SIPDispatchRuleInfo(
                dispatch_rule_individual=proto_sip.SIPDispatchRuleIndividual(
                    room_prefix="call-"
                )
            )
        )
    )
)

# Alle Anrufer → gleicher Room (z.B. Konferenz)
rule = await lk.sip.create_sip_dispatch_rule(
    proto_sip.CreateSIPDispatchRuleRequest(
        rule=proto_sip.SIPDispatchRule(
            rule=proto_sip.SIPDispatchRuleInfo(
                dispatch_rule_direct=proto_sip.SIPDispatchRuleDirect(
                    room_name="conference-room"
                )
            )
        )
    )
)
```

### Agent für eingehende Calls
```python
@server.rtc_session(agent_name="inbound-agent")
async def handle_call(ctx: agents.JobContext):
    # SIP Metadata auslesen
    participant = ctx.room.remote_participants.values().__iter__().__next__()
    caller_number = participant.attributes.get("sip.callFrom", "unknown")
    called_number = participant.attributes.get("sip.callTo", "unknown")
    
    session = AgentSession(...)
    await session.start(room=ctx.room, agent=MyAgent())
    await session.generate_reply(instructions=f"Begrüße den Anrufer von {caller_number}.")
```

---

## 11. Outbound Calls

### Outbound Trunk erstellen
```python
trunk = await lk.sip.create_sip_outbound_trunk(
    proto_sip.CreateSIPOutboundTrunkRequest(
        trunk=proto_sip.SIPOutboundTrunkInfo(
            name="Outbound Trunk",
            address="sip.telnyx.com",         # Provider SIP Domain
            numbers=["+4917612345678"],         # Absendernummer
            auth_username="telnyx_user",
            auth_password="telnyx_password",
        )
    )
)
trunk_id = trunk.sip_trunk_id
```

### Outbound Call platzieren
```python
from livekit import api
from livekit.protocol import sip as proto_sip

async def make_call(to_number: str, room_name: str):
    lk = api.LiveKitAPI(...)
    
    participant = await lk.sip.create_sip_participant(
        proto_sip.CreateSIPParticipantRequest(
            room_name=room_name,
            sip_trunk_id=trunk_id,
            sip_call_to=f"tel:{to_number}",
            participant_name="Outbound Call",
            participant_identity=f"phone_{to_number}",
            # Warten bis Anruf angenommen
            wait_until_answered=True,
        )
    )
    return participant
```

### Outbound Agent mit automatischem Room
```python
import asyncio
from livekit import agents, api
from livekit.protocol import sip as proto_sip

async def place_outbound_call(to_number: str):
    lk = api.LiveKitAPI(
        url=os.getenv("LIVEKIT_URL"),
        api_key=os.getenv("LIVEKIT_API_KEY"),
        api_secret=os.getenv("LIVEKIT_API_SECRET"),
    )
    
    room_name = f"outbound-{to_number}-{int(asyncio.get_event_loop().time())}"
    
    # Room erstellen
    await lk.room.create_room(api.CreateRoomRequest(name=room_name))
    
    # Agent dispatchen
    await lk.agent.create_agent_dispatch(
        api.CreateAgentDispatchRequest(
            room_name=room_name,
            agent_name="outbound-agent",
        )
    )
    
    # SIP Call platzieren
    await lk.sip.create_sip_participant(
        proto_sip.CreateSIPParticipantRequest(
            room_name=room_name,
            sip_trunk_id=os.getenv("SIP_TRUNK_ID"),
            sip_call_to=f"tel:{to_number}",
            wait_until_answered=True,
        )
    )
```

### Call Transfer
```python
# Cold Transfer (direkt weiterleiten)
from livekit.agents.prebuilt.tools import EndCallTool

# Warm Transfer (mit Übergabe-Kontext)
from livekit.agents.prebuilt.tasks import WarmTransferTask
```

---

## 12. Turn Detection & Latency Tuning

### Silero VAD (Voice Activity Detection)
```python
from livekit.plugins import silero

vad = silero.VAD.load(
    min_speech_duration=0.1,      # Mindestdauer für Sprache (s)
    min_silence_duration=0.3,     # Mindest-Pause vor Ende (s)
    padding_duration=0.1,         # Padding nach Sprache
    sample_rate=16000,
    activation_threshold=0.5,     # 0.0-1.0, höher = weniger sensitiv
)
```

### Turn Detector (ML-basiert, empfohlen)
```python
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import TurnHandlingOptions

turn_handling = TurnHandlingOptions(
    turn_detection=MultilingualModel(),
    # oder für Englisch:
    # turn_detection=EnglishModel(),
)
```

### Latenz-Optimierung
```python
session = AgentSession(
    stt=deepgram.STT(model="nova-3"),
    llm=openai.responses.LLM(model="gpt-4o-mini"),  # Kleineres Modell = schneller
    tts=cartesia.TTS(model="sonic-turbo"),           # Turbo = niedrigere Latenz
    vad=silero.VAD.load(),
    turn_handling=TurnHandlingOptions(
        turn_detection=MultilingualModel(),
        # Preemptive generation: Agent beginnt zu antworten bevor Turn confirmed
        preemptive_generation=True,
    ),
)
```

### TTS Caching
```python
# TTS-Antworten cachen (z.B. Begrüßungen)
from livekit.agents.multimodality.audio import TTSCache

# Im Agent: generate_reply nutzt automatisch Cache wenn verfügbar
await session.generate_reply(
    instructions="Sage 'Willkommen bei DeseoAI!'",
    allow_interruptions=True,
)
```

### Interruption Handling
```python
turn_handling = TurnHandlingOptions(
    turn_detection=MultilingualModel(),
    # Adaptive Interruption: Unterscheidet echte Interruptions von Backchannels
    adaptive_interruption=True,
)
```

---

## 13. Environment Variables

### Pflicht-Variablen
```env
# LiveKit
LIVEKIT_URL=wss://<project-id>.livekit.cloud
LIVEKIT_API_KEY=<api-key>
LIVEKIT_API_SECRET=<api-secret>
```

### AI Provider Keys
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
ELEVEN_API_KEY=...
GROQ_API_KEY=gsk_...
XAI_API_KEY=...
MISTRAL_API_KEY=...
TOGETHER_API_KEY=...
FIREWORKS_API_KEY=...
PERPLEXITY_API_KEY=...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=eu-central-1

# Azure
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=https://....openai.azure.com/
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=germanywestcentral
```

### SIP / Telephony
```env
SIP_TRUNK_ID=ST_...           # Outbound Trunk ID
SIP_INBOUND_TRUNK_ID=ST_...   # Inbound Trunk ID
```

### Debug Flags
```env
LK_GOOGLE_DEBUG=1             # Google Live API Debug-Logs
LIVEKIT_LOG_LEVEL=debug       # debug, info, warn, error
```

---

## 14. LiveKit Inference

Direkter Zugang zu besten Modellen über LiveKit Cloud — kein eigener Provider-Account nötig.

### Verfügbare Inference-Modelle (Stand 2026-06)

**STT:**
```
deepgram/nova-3          # empfohlen, multilingual
deepgram/nova-3-medical  # medizinisch
deepgram/nova-2          # stabil
deepgram/flux-general    # neuestes
assemblyai/best          # sehr akkurat
```

**LLM:**
```
openai/gpt-5.3-chat-latest   # neuestes GPT
openai/gpt-5.2-chat-latest   # stabil
openai/gpt-4o                # bewährt
openai/gpt-4o-mini           # schnell/günstig
```

**TTS:**
```
cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc  # Standard
cartesia/sonic-2             # stabil
elevenlabs/<voice-id>        # ElevenLabs Voices
```

### Inference Billing
- Teil von LiveKit Cloud (kein separates Konto)
- Abrechnung per Token/Minute direkt im LiveKit Dashboard
- Monitoring: https://cloud.livekit.io/projects/p_/usage

---

## 15. Deployment

### LiveKit Cloud Deployment
```bash
# Agent registrieren
lk agent create --name my-agent

# Von lokalem Verzeichnis deployen
lk agent deploy --name my-agent

# Status prüfen
lk agent list

# Logs
lk agent logs --name my-agent --follow
```

### Docker (self-hosted)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

# Model-Files herunterladen
RUN python -m livekit.agents download-files

CMD ["python", "agent.py", "start"]
```

```bash
docker build -t my-agent .
docker run -d --env-file .env my-agent
```

### Systemd Service
```ini
[Unit]
Description=LiveKit Agent
After=network.target

[Service]
Type=simple
User=livekit
WorkingDirectory=/opt/livekit/agents/my-agent
EnvironmentFile=/opt/livekit/agents/my-agent/.env
ExecStart=/usr/bin/python agent.py start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Scaling
- LiveKit Cloud auto-scales Agent-Instanzen
- Für self-hosted: mehrere Instanzen mit gleichem LIVEKIT_URL/API_KEY/SECRET
- Jede Instanz nimmt unabhängig Jobs aus der Queue

---

## 16. Tips & Tricks

### 1. Greeting Audio pre-generieren (Latenz ↓)
```python
async def session(ctx: agents.JobContext):
    # Begrüßung schon beim Start generieren
    greeting_task = asyncio.create_task(
        tts.synthesize("Willkommen bei DeseoAI! Wie kann ich helfen?")
    )
    session = AgentSession(...)
    await session.start(room=ctx.room, agent=MyAgent())
    
    # Vorher generierte Begrüßung abspielen
    audio = await greeting_task
    await session.say(audio)
```

### 2. Mehrsprachige Agents
```python
# Deepgram Nova-3 + MultilingualModel erkennt Sprache automatisch
stt = deepgram.STT(model="nova-3", language="multi")
turn_handling = TurnHandlingOptions(turn_detection=MultilingualModel())

# LLM mit Sprachhinweis im System Prompt
class MultilingualAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions="Detect the user's language and always respond in the same language."
        )
```

### 3. Tool Calls für Datenbankzugriff
```python
from livekit.agents import function_tool

class MyAgent(Agent):
    @function_tool
    async def get_customer_info(self, phone_number: str) -> str:
        """Kundendaten aus Datenbank abrufen."""
        # Datenbankabfrage
        customer = await db.get_by_phone(phone_number)
        return f"Name: {customer.name}, Account: {customer.id}"
    
    @function_tool
    async def book_appointment(self, date: str, time: str) -> str:
        """Termin buchen."""
        result = await calendar.book(date, time)
        return f"Termin bestätigt für {date} um {time}"
```

### 4. Call Metadata auslesen
```python
async def session(ctx: agents.JobContext):
    # Auf alle Participants warten
    await ctx.connect()
    
    for identity, participant in ctx.room.remote_participants.items():
        attrs = participant.attributes
        caller = attrs.get("sip.callFrom", "")
        called = attrs.get("sip.callTo", "")
        trunk_id = attrs.get("sip.trunkID", "")
        print(f"Inbound: {caller} → {called} via {trunk_id}")
```

### 5. Noise Cancellation
```python
from livekit.agents import room_io
from livekit.plugins import ai_coustics

await session.start(
    room=ctx.room,
    agent=MyAgent(),
    room_options=room_io.RoomOptions(
        audio_input=room_io.AudioInputOptions(
            noise_cancellation=ai_coustics.audio_enhancement(
                model=ai_coustics.EnhancerModel.QUAIL_VF_S
            ),
        ),
    ),
)
```

### 6. Background Audio (Wartemusik/Denken)
```python
from livekit.agents.multimodality.audio import BackgroundAudio

# Denkgeräusch während Agent verarbeitet
background_audio = BackgroundAudio(
    thinking_sound=True,
    ambient_sound="cafe",  # optional
)
```

### 7. Fallback-Strategie
```python
from livekit.agents import fallback

# Automatischer Fallback wenn Provider ausfällt
stt = fallback.STT(
    primary=deepgram.STT(),
    fallback=openai.STT(),
)
```

### 8. Outbound Call mit Answering Machine Detection
```python
participant = await lk.sip.create_sip_participant(
    proto_sip.CreateSIPParticipantRequest(
        room_name=room_name,
        sip_trunk_id=trunk_id,
        sip_call_to=f"tel:{to_number}",
        wait_until_answered=True,
        # AMD aktivieren
        krisp_enabled=True,
    )
)

# Im Agent AMD-Ergebnis prüfen
amd_result = participant.attributes.get("sip.amd.result", "")
if amd_result == "human":
    await session.generate_reply(instructions="Begrüße den Anrufer.")
elif amd_result == "voicemail":
    await session.say("Hallo, hier ist DeseoAI. Bitte rufen Sie uns zurück.")
    await ctx.room.disconnect()
```

### 9. DTMF senden/empfangen
```python
# DTMF empfangen
@session.on("dtmf_received")
async def on_dtmf(digit: str):
    print(f"DTMF: {digit}")
    if digit == "1":
        await session.say("Sie haben 1 gedrückt.")

# DTMF senden (für IVR-Navigation)
from livekit.agents.prebuilt.tools import send_dtmf_events
```

### 10. Prompting Best Practices für Voice
```
✅ TU:
- Kurze, gesprochene Sätze
- "Kannst du mir..." statt "Bitte geben Sie an..."
- Keine Markdown/Listen in Antworten
- Zahlen ausschreiben: "zwanzig Euro" statt "20 €"
- Pausen mit "..." signalisieren

❌ NICHT:
- Bullet Points / Listen
- Tabellen
- URLs vorlesen lassen
- Zu lange Sätze (>20 Wörter)
- Emojis, Sonderzeichen
```

---

## 17. Troubleshooting

### SIP Call kommt nicht an
```bash
# 1. SIP URI prüfen
lk project list --json  # ProjectId → SIP URI

# 2. Inbound Trunk ID prüfen
lk sip inbound list

# 3. Dispatch Rules prüfen
lk sip dispatch list

# 4. Test-Call
lk sip call --trunk <trunk-id> --to <number>
```

### Agent verbindet sich nicht
```bash
# API Keys prüfen
echo $LIVEKIT_URL $LIVEKIT_API_KEY

# Agent-Status
lk agent list

# Logs live
lk agent logs --follow
```

### Hohe Latenz
```
1. STT: Deepgram nova-3 (streaming)
2. LLM: gpt-4o-mini oder groq/llama (schneller als gpt-4o)
3. TTS: cartesia/sonic-turbo oder lmnt
4. Turn-Detector: MultilingualModel (statt VAD-only)
5. Region: Agent-Server in gleicher Region wie Nutzer
```

### Audio-Qualität schlecht
```python
# 1. Noise Cancellation aktivieren
# 2. Deepgram nova-3-general statt nova-2
# 3. HD Voice für SIP aktivieren
trunk = SIPOutboundTrunkInfo(
    ...
    # OPUS Codec erzwingen für HD Voice
)
```

### TypeScript/Node.js AgentSession Fehler
```typescript
// Node.js SDK: Packages separat
import * as openai from '@livekit/agents-plugin-openai';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as cartesia from '@livekit/agents-plugin-cartesia';

const session = new AgentSession({
    llm: new openai.LLM({ model: "gpt-4o" }),
    stt: new deepgram.STT({ model: "nova-3" }),
    tts: new cartesia.TTS({ model: "sonic-3" }),
});
```

---

## Quick Reference

### Beste Kombination für DE Voice Agent
```python
stt = deepgram.STT(model="nova-3", language="de")     # Bestes DE STT
llm = openai.responses.LLM(model="gpt-4o")            # Beste Qualität
tts = cartesia.TTS(model="sonic-3", voice="<de-voice>") # Niedrige Latenz
vad = silero.VAD.load()
turn_handling = TurnHandlingOptions(turn_detection=MultilingualModel())
```

### Beste Kombination für ultra-low latency
```python
stt = deepgram.STT(model="nova-3")
llm = groq.LLM(model="llama-3.3-70b-versatile")        # Groq = schnellste Inferenz
tts = cartesia.TTS(model="sonic-turbo")                 # Turbo = kleinste Latenz
```

### Realtime Alternative
```python
llm = openai.realtime.RealtimeModel(model="gpt-4o-realtime-preview", voice="coral")
```

### SIP URI Format
```
sip:<project-id>.sip.livekit.cloud
# Beispiel: sip:vjnxecm0tjk.sip.livekit.cloud
```

### Wichtige Links
- LiveKit Cloud: https://cloud.livekit.io
- Python SDK Docs: https://docs.livekit.io/agents
- Telephony Docs: https://docs.livekit.io/telephony
- Plugin Übersicht: https://docs.livekit.io/agents/models
- Recipes: https://docs.livekit.io/reference/recipes
- GitHub Python SDK: https://github.com/livekit/agents
- GitHub Beispiele: https://github.com/livekit-examples

---

*Generiert von Claude Code (claude-sonnet-4-6) | DeseoAI intern | 2026-06-13*
