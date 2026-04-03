"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════════════
   SCORE FIELDS CONFIG
   ═══════════════════════════════════════════════════ */
const SCORE_FIELDS = [
  { key: "overall_call_quality_score_1_10", label: "Gesamtqualität", short: "Gesamt", color: "#6C5CE7" },
  { key: "agent_professionalism_score_1_10", label: "Professionalität", short: "Profi", color: "#2563EB" },
  { key: "empathy_score_1_10", label: "Empathie", short: "Empathie", color: "#E84393" },
  { key: "clarity_communication_score_1_10", label: "Klarheit", short: "Klarheit", color: "#00B894" },
  { key: "call_control_score_1_10", label: "Gesprächsführung", short: "Führung", color: "#F39C12" },
  { key: "product_knowledge_score_1_10", label: "Produktwissen", short: "Wissen", color: "#6C5CE7" },
  { key: "process_adherence_score_1_10", label: "Prozesstreue", short: "Prozess", color: "#00CEC9" },
  { key: "problem_resolution_score_1_10", label: "Problemlösung", short: "Lösung", color: "#E17055" },
  { key: "next_step_clarity_score_1_10", label: "Nächste Schritte", short: "Next Steps", color: "#FDCB6E" },
  { key: "customer_mood_score_1_10", label: "Kundenstimmung", short: "Stimmung", color: "#55EFC4" },
];

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

/* ═══════════════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════════════ */
function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  const pct = (value / 10) * 100;
  const textColor = value >= 7 ? "#059669" : value >= 5 ? "#D97706" : "#DC2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
      <div style={{ width: 110, fontSize: 12, color: "#64748B", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: color, width: pct + "%", transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", opacity: 0.8 }} />
      </div>
      <div style={{ width: 36, textAlign: "right", fontSize: 13, fontWeight: 700, color: textColor, fontFamily: "var(--font-dm-mono, monospace)" }}>{value.toFixed(1)}</div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 18px", flex: "1 1 140px", minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4, fontFamily: "var(--font-dm-mono, monospace)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children, style }: { title?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden", ...style }}>
      {title && <div style={{ padding: "14px 18px", borderBottom: "1px solid #F1F5F9", fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{title}</div>}
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CALL ROW (Scores Tab)
   ═══════════════════════════════════════════════════ */
function CallRow({ call, isExpanded, onToggle }: { call: any; isExpanded: boolean; onToggle: () => void }) {
  const score = call.overall_call_quality_score_1_10;
  const scoreColor = score >= 7 ? "#059669" : score >= 5 ? "#D97706" : "#DC2626";
  const scoreBg = score >= 7 ? "#F0FDF4" : score >= 5 ? "#FFFBEB" : "#FEF2F2";
  const date = call.start_time ? new Date(call.start_time).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", padding: "12px 16px", cursor: "pointer", transition: "background 0.12s", gap: 12 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
        <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: scoreBg, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-dm-mono, monospace)" }}>{score ?? "—"}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{call.caller_name}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{call.call_category}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: "#64748B" }}>{date}</div>
          <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "var(--font-dm-mono, monospace)" }}>{call.duration}</div>
        </div>
        <div style={{ fontSize: 10, color: "#CBD5E1", transition: "transform 0.2s", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▼</div>
      </div>
      {isExpanded && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 18, border: "1px solid #E2E8F0" }}>
            <div style={{ marginBottom: 16 }}>
              {SCORE_FIELDS.map(f => (<ScoreBar key={f.key} value={call[f.key] ?? 0} label={f.short} color={f.color} />))}
            </div>
            <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6, padding: "12px 0", borderTop: "1px solid #E2E8F0" }}>
              <span style={{ fontWeight: 600, color: "#475569" }}>Zusammenfassung: </span>{call.transcript_summary}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8 }}>
              {[call.call_result && "Ergebnis: " + call.call_result, "Stimmung: " + call.sentiment + "/10", call.total_turns + " Turns", call.caller_phone].filter(Boolean).map((tag, i) => (
                <span key={i} style={{ fontSize: 10, padding: "3px 8px", background: "#EEF2FF", color: "#6C5CE7", borderRadius: 6, fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HEATMAP COMPONENT (Insights Tab)
   ═══════════════════════════════════════════════════ */
function Heatmap({ calls }: { calls: any[] }) {
  const grid: Record<string, number> = {};
  let maxVal = 0;

  calls.forEach(c => {
    if (!c.start_time) return;
    const d = new Date(c.start_time);
    const day = d.getDay();
    const hour = d.getHours();
    if (hour < 7 || hour > 20) return;
    const key = `${day}-${hour}`;
    grid[key] = (grid[key] || 0) + 1;
    if (grid[key] > maxVal) maxVal = grid[key];
  });

  if (maxVal === 0) return <div style={{ textAlign: "center", padding: 20, color: "#94A3B8", fontSize: 12 }}>Noch nicht genug Daten für die Heatmap</div>;

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `40px repeat(${HOURS.length}, 1fr)`, gap: 3, minWidth: 400 }}>
        {/* Header */}
        <div />
        {HOURS.map(h => (
          <div key={h} style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", padding: "4px 0" }}>{h}h</div>
        ))}
        {/* Rows */}
        {[1, 2, 3, 4, 5, 6, 0].map(day => (
          <>
            <div key={`label-${day}`} style={{ fontSize: 11, color: "#64748B", display: "flex", alignItems: "center", fontWeight: 600 }}>{WEEKDAYS[day]}</div>
            {HOURS.map(hour => {
              const count = grid[`${day}-${hour}`] || 0;
              const intensity = maxVal > 0 ? count / maxVal : 0;
              return (
                <div key={`${day}-${hour}`} title={`${WEEKDAYS[day]} ${hour}:00 — ${count} Anrufe`} style={{
                  height: 28, borderRadius: 4,
                  background: count === 0 ? "#F8FAFC" : `rgba(108, 92, 231, ${0.15 + intensity * 0.85})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: intensity > 0.5 ? "white" : "#94A3B8", fontWeight: 600,
                  cursor: "default", transition: "all 0.15s",
                }}>{count > 0 ? count : ""}</div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TOPIC BAR (Insights Tab)
   ═══════════════════════════════════════════════════ */
function TopicBars({ calls }: { calls: any[] }) {
  const topics: Record<string, number> = {};
  calls.forEach(c => {
    const cat = c.call_category || "Unbekannt";
    topics[cat] = (topics[cat] || 0) + 1;
  });

  const sorted = Object.entries(topics).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = sorted[0]?.[1] || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {sorted.map(([topic, count]) => (
        <div key={topic} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 100, fontSize: 12, color: "#64748B", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topic}</div>
          <div style={{ flex: 1, height: 24, background: "#F1F5F9", borderRadius: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 6,
              background: "linear-gradient(90deg, #6C5CE7, #A29BFE)",
              width: `${(count / maxCount) * 100}%`,
              transition: "width 0.6s ease",
              display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{count}</span>
            </div>
          </div>
        </div>
      ))}
      {sorted.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#94A3B8", fontSize: 12 }}>Keine Kategorien vorhanden</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   RESULT DONUT (Insights Tab)
   ═══════════════════════════════════════════════════ */
function ResultSummary({ calls }: { calls: any[] }) {
  const total = calls.length;
  const resolved = calls.filter(c => {
    const r = (c.call_result || "").toLowerCase();
    return r.includes("erfolgreich") || r.includes("gebucht") || r.includes("reservier") || r.includes("gelöst") || r.includes("termin");
  }).length;
  const abandoned = calls.filter(c => {
    const r = (c.call_result || "").toLowerCase();
    return r.includes("abgebrochen") || r.includes("vorzeitig") || r.includes("aufgelegt") || r.includes("kein");
  }).length;
  const other = total - resolved - abandoned;

  const avgSentiment = calls.reduce((a, c) => a + (parseFloat(c.sentiment) || 0), 0) / (total || 1);
  const avgDuration = calls.reduce((a, c) => a + (c.duration_seconds || 0), 0) / (total || 1);

  const segments = [
    { label: "Erfolgreich", count: resolved, color: "#059669", bg: "#F0FDF4" },
    { label: "Abgebrochen", count: abandoned, color: "#DC2626", bg: "#FEF2F2" },
    { label: "Sonstiges", count: other, color: "#6C5CE7", bg: "#EEF2FF" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        {segments.map(s => (
          <div key={s.label} style={{ flex: "1 1 80px", padding: "12px 14px", background: s.bg, borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "var(--font-dm-mono, monospace)" }}>{s.count}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 500, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "#64748B" }}>Ø Stimmung: <strong style={{ color: avgSentiment >= 6 ? "#059669" : "#D97706" }}>{avgSentiment.toFixed(1)}/10</strong></div>
        <div style={{ fontSize: 12, color: "#64748B" }}>Ø Dauer: <strong>{(avgDuration / 60).toFixed(1)} Min</strong></div>
        <div style={{ fontSize: 12, color: "#64748B" }}>Sprachen: <strong>{[...new Set(calls.map(c => c.language))].join(", ") || "—"}</strong></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROMPT OPTIMIZER (Optimierung Tab)
   ═══════════════════════════════════════════════════ */
function PromptOptimizer({ calls, agg }: { calls: any[]; agg: any }) {
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[] | null>(null);

  // Find weak scores (below 6)
  const weakScores = SCORE_FIELDS.filter(f => (agg[f.key] || 10) < 6).sort((a, b) => (agg[a.key] || 0) - (agg[b.key] || 0));
  const strongScores = SCORE_FIELDS.filter(f => (agg[f.key] || 0) >= 7).sort((a, b) => (agg[b.key] || 0) - (agg[a.key] || 0));

  // Analyze bad calls
  const badCalls = calls.filter(c => (c.overall_call_quality_score_1_10 || 10) < 5);
  const goodCalls = calls.filter(c => (c.overall_call_quality_score_1_10 || 0) >= 7);

  // Generate suggestions locally (pattern matching)
  const autoSuggestions = useMemo(() => {
    const s: { icon: string; title: string; description: string; priority: "high" | "medium" | "low" }[] = [];

    if (weakScores.find(w => w.key.includes("empathy"))) {
      s.push({ icon: "💗", title: "Empathie verbessern", description: "Fügen Sie im Prompt hinzu: 'Zeige Verständnis für die Situation des Anrufers. Verwende Sätze wie: Ich verstehe, das ist ärgerlich / Das kann ich gut nachvollziehen / Lassen Sie mich Ihnen helfen.'", priority: "high" });
    }
    if (weakScores.find(w => w.key.includes("clarity"))) {
      s.push({ icon: "🎯", title: "Klarheit der Kommunikation", description: "Ergänzen Sie: 'Fasse am Ende jedes Gesprächsabschnitts kurz zusammen was besprochen wurde. Vermeide Fachbegriffe. Sprich in kurzen, klaren Sätzen.'", priority: "high" });
    }
    if (weakScores.find(w => w.key.includes("problem_resolution"))) {
      s.push({ icon: "🔧", title: "Problemlösung stärken", description: "Fügen Sie dem FAQ-Bereich mehr konkrete Lösungen hinzu. Ergänzen Sie im Prompt: 'Versuche immer eine konkrete Lösung oder den nächsten Schritt anzubieten, nie den Anrufer ohne Ergebnis zu entlassen.'", priority: "high" });
    }
    if (weakScores.find(w => w.key.includes("next_step"))) {
      s.push({ icon: "➡️", title: "Nächste Schritte definieren", description: "Prompt-Ergänzung: 'Beende jedes Gespräch mit einer klaren Zusammenfassung: Was wurde vereinbart? Was passiert als nächstes? Wann meldet sich wer?'", priority: "medium" });
    }
    if (weakScores.find(w => w.key.includes("product_knowledge"))) {
      s.push({ icon: "📚", title: "Wissensbasis erweitern", description: "Die häufigsten Themen sind in den FAQs nicht abgedeckt. Ergänzen Sie die 'Häufige Fragen & Antworten' Sektion im Agent Editor mit den Top-Themen aus dem Insights-Tab.", priority: "medium" });
    }
    if (weakScores.find(w => w.key.includes("customer_mood"))) {
      s.push({ icon: "😊", title: "Kundenstimmung verbessern", description: "Prompt-Ergänzung: 'Starte positiv und energetisch. Nutze den Namen des Anrufers wenn bekannt. Bedanke dich am Ende für den Anruf.'", priority: "medium" });
    }
    if (weakScores.find(w => w.key.includes("call_control"))) {
      s.push({ icon: "🎛️", title: "Gesprächsführung optimieren", description: "Prompt-Ergänzung: 'Führe das Gespräch aktiv. Stelle gezielte Fragen statt offener. Wenn das Gespräch abschweit, lenke freundlich zurück: Kommen wir zurück zu Ihrem Anliegen...'", priority: "medium" });
    }
    if (badCalls.length > 0 && badCalls.some(c => (c.duration_seconds || 0) < 15)) {
      s.push({ icon: "⏱️", title: "Zu kurze Gespräche", description: `${badCalls.filter(c => (c.duration_seconds || 0) < 15).length} Calls waren unter 15 Sekunden. Überprüfen Sie die Begrüßung — ist sie einladend genug? Stellt der Agent sofort eine Frage?`, priority: "low" });
    }
    if (calls.some(c => c.language === "EN") && calls.some(c => c.language === "DE")) {
      s.push({ icon: "🌍", title: "Mehrsprachige Anrufer", description: "Es gibt Calls in verschiedenen Sprachen. Erwägen Sie den STT auf 'multi' (Multilingual) zu stellen und eine Anweisung hinzuzufügen: 'Antworte in der Sprache des Anrufers.'", priority: "low" });
    }

    // If everything is great
    if (s.length === 0 && strongScores.length >= 5) {
      s.push({ icon: "🏆", title: "Ausgezeichnete Performance", description: "Alle Scores sind im grünen Bereich. Der Agent performt überdurchschnittlich. Keine kritischen Optimierungen nötig.", priority: "low" });
    }

    return s;
  }, [calls, weakScores, strongScores, badCalls]);

  const priorityColors = { high: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", label: "Hoch" }, medium: { bg: "#FFFBEB", border: "#FDE68A", text: "#D97706", label: "Mittel" }, low: { bg: "#F0FDF4", border: "#BBF7D0", text: "#059669", label: "Niedrig" } };

  return (
    <div>
      {/* Score Health Overview */}
      <Card title="Score-Gesundheit" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#DC2626", fontFamily: "var(--font-dm-mono, monospace)" }}>{weakScores.length}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Schwächen (&lt;6)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#059669", fontFamily: "var(--font-dm-mono, monospace)" }}>{strongScores.length}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Stärken (≥7)</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#DC2626", fontFamily: "var(--font-dm-mono, monospace)" }}>{badCalls.length}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Kritische Calls</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#059669", fontFamily: "var(--font-dm-mono, monospace)" }}>{goodCalls.length}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Gute Calls</div>
          </div>
        </div>

        {/* Weak scores detail */}
        {weakScores.length > 0 && (
          <div style={{ padding: "12px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>Schwächste Bereiche:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {weakScores.map(w => (
                <span key={w.key} style={{ fontSize: 12, padding: "4px 10px", background: "white", borderRadius: 6, color: "#DC2626", fontWeight: 600, border: "1px solid #FECACA" }}>
                  {w.label}: {(agg[w.key] || 0).toFixed(1)}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* AI Suggestions */}
      <Card title={`Optimierungsvorschläge (${autoSuggestions.length})`} style={{ marginBottom: 18 }}>
        {autoSuggestions.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "#94A3B8", fontSize: 12 }}>
            Nicht genug Daten für Vorschläge. Mindestens 3 Calls nötig.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {autoSuggestions.map((s, i) => {
              const pc = priorityColors[s.priority];
              return (
                <div key={i} style={{ padding: "14px 16px", background: pc.bg, borderRadius: 10, border: `1px solid ${pc.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{s.title}</span>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 700, background: "white", color: pc.text, border: `1px solid ${pc.border}` }}>
                      Priorität: {pc.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{s.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Bad Call Analysis */}
      {badCalls.length > 0 && (
        <Card title={`Kritische Calls analysiert (${badCalls.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {badCalls.slice(0, 5).map((call, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{call.caller_name} — Score: {call.overall_call_quality_score_1_10}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{call.duration}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{call.transcript_summary}</div>
                <div style={{ fontSize: 11, color: "#DC2626", marginTop: 6, fontWeight: 500 }}>
                  Schwächen: {SCORE_FIELDS.filter(f => (call[f.key] || 10) <= 3).map(f => f.short).join(", ") || "—"}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function AgentScores({ notionDbId, agentName }: { notionDbId: string; agentName: string }) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [tab, setTab] = useState<"scores" | "insights" | "optimize">("scores");

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const res = await fetch("/api/scores?db=" + notionDbId); const data = await res.json(); if (data.error) throw new Error(data.error); setCalls(data.calls || []); }
    catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [notionDbId]);

  useEffect(() => { load(); }, [load]);

  // Aggregates
  const valid = calls.filter(c => c.overall_call_quality_score_1_10 !== null);
  const agg: any = {};
  if (valid.length > 0) {
    for (const f of SCORE_FIELDS) { const vals = valid.map(c => c[f.key]).filter((v: any) => v !== null); agg[f.key] = vals.length > 0 ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0; }
    agg.totalCalls = valid.length;
    agg.avgDuration = valid.reduce((a: number, c: any) => a + c.duration_seconds, 0) / valid.length;
    agg.avgTurns = valid.reduce((a: number, c: any) => a + c.total_turns, 0) / valid.length;
  }

  const filtered = filter === "all" ? calls : filter === "good" ? calls.filter(c => (c.overall_call_quality_score_1_10 ?? 0) >= 7) : calls.filter(c => (c.overall_call_quality_score_1_10 ?? 0) < 5);
  const overallAvg = agg.overall_call_quality_score_1_10 ?? 0;
  const overallColor = overallAvg >= 7 ? "#059669" : overallAvg >= 5 ? "#D97706" : "#DC2626";

  if (loading) return (<div style={{ textAlign: "center", padding: "60px 20px" }}><div style={{ width: 32, height: 32, border: "3px solid #6C5CE7", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} /><div style={{ fontSize: 13, color: "#94A3B8" }}>Lade Call-Daten...</div><style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style></div>);
  if (error) return (<div style={{ padding: 20, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 13 }}>Fehler: {error}</div>);
  if (calls.length === 0) return (<div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div style={{ fontSize: 14, fontWeight: 600 }}>Noch keine Call-Daten</div></div>);

  const TABS = [
    { id: "scores" as const, label: "📊 Scores", count: valid.length },
    { id: "insights" as const, label: "📈 Insights", count: calls.length },
    { id: "optimize" as const, label: "🧠 Optimierung", count: SCORE_FIELDS.filter(f => (agg[f.key] || 10) < 6).length },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Gesamt-Score" value={overallAvg.toFixed(1)} sub="Ø aller Calls" color={overallColor} />
        <StatCard label="Anrufe" value={String(agg.totalCalls || calls.length)} sub="ausgewertet" color="#6C5CE7" />
        <StatCard label="Ø Dauer" value={agg.avgDuration ? Math.round(agg.avgDuration) + "s" : "—"} sub={agg.avgDuration ? (agg.avgDuration / 60).toFixed(1) + " Min" : ""} color="#2563EB" />
        <StatCard label="Ø Turns" value={agg.avgTurns ? agg.avgTurns.toFixed(0) : "—"} sub="pro Gespräch" color="#E84393" />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F1F5F9", borderRadius: 10, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "10px 12px", fontSize: 12, borderRadius: 8, border: "none", cursor: "pointer",
            fontWeight: 600, fontFamily: "inherit", transition: "all 0.15s",
            background: tab === t.id ? "white" : "transparent",
            color: tab === t.id ? "#1E293B" : "#94A3B8",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>
            {t.label}
            {t.count > 0 && tab !== t.id && (
              <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 4, background: t.id === "optimize" && t.count > 0 ? "#FEF2F2" : "#EEF2FF", color: t.id === "optimize" && t.count > 0 ? "#DC2626" : "#6C5CE7", fontWeight: 700 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ SCORES TAB ═══ */}
      {tab === "scores" && (
        <div>
          <Card title="Durchschnittliche Bewertungen" style={{ marginBottom: 20 }}>
            {SCORE_FIELDS.map(f => (<ScoreBar key={f.key} value={agg[f.key] || 0} label={f.label} color={f.color} />))}
          </Card>

          <div style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #E2E8F0", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>Letzte Anrufe <span style={{ fontWeight: 400, color: "#94A3B8", marginLeft: 6, fontSize: 12 }}>{filtered.length} {filter !== "all" ? "gefiltert" : "gesamt"}</span></span>
              <div style={{ display: "flex", gap: 4 }}>
                {[{ key: "all", label: "Alle" }, { key: "good", label: "≥ 7" }, { key: "bad", label: "< 5" }].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", background: filter === f.key ? "#EEF2FF" : "#F8FAFC", color: filter === f.key ? "#6C5CE7" : "#94A3B8" }}>{f.label}</button>
                ))}
              </div>
            </div>
            <div style={{ maxHeight: 500, overflowY: "auto" }}>
              {filtered.length === 0 ? (<div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Keine Anrufe gefunden</div>) : filtered.map(call => (
                <CallRow key={call.id} call={call} isExpanded={expandedId === call.id} onToggle={() => setExpandedId(expandedId === call.id ? null : call.id)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INSIGHTS TAB ═══ */}
      {tab === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card title="Anruf-Heatmap — Wann wird am meisten angerufen?">
            <Heatmap calls={calls} />
          </Card>
          <Card title="Top-Themen">
            <TopicBars calls={calls} />
          </Card>
          <Card title="Ergebnisse & Stimmung">
            <ResultSummary calls={calls} />
          </Card>
        </div>
      )}

      {/* ═══ OPTIMIZE TAB ═══ */}
      {tab === "optimize" && (
        <PromptOptimizer calls={calls} agg={agg} />
      )}

      {/* Refresh */}
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <button onClick={load} style={{ padding: "8px 18px", fontSize: 12, borderRadius: 8, cursor: "pointer", border: "1px solid #E2E8F0", background: "white", color: "#64748B", fontFamily: "inherit", fontWeight: 600, transition: "all 0.12s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6C5CE7"; e.currentTarget.style.color = "#6C5CE7" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B" }}>↻ Aktualisieren</button>
      </div>
    </div>
  );
}
