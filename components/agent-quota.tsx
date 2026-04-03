"use client";
import { useState, useEffect, useCallback } from "react";

export default function AgentQuota({ notionDbId, quotaMinutes }: { notionDbId: string; quotaMinutes: number }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDaily, setShowDaily] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quota?db=${notionDbId}&quota=${quotaMinutes}`);
      const d = await res.json();
      if (!d.error) setData(d);
    } catch {}
    finally { setLoading(false); }
  }, [notionDbId, quotaMinutes]);

  useEffect(() => { load(); }, [load]);

  if (!notionDbId || !quotaMinutes) return null;

  if (loading) return (
    <div style={{ background: "white", border: "1px solid var(--border, #E2E8F0)", borderRadius: 12, padding: "16px 20px", margin: "0 28px 0 28px" }}>
      <div style={{ fontSize: 12, color: "#94A3B8", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 14, height: 14, border: "2px solid #6C5CE7", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        Kontingent wird geladen...
      </div>
    </div>
  );

  if (!data) return null;

  const { quota_minutes, used_minutes, remaining_minutes, usage_percent, total_calls, month_name, year, days_remaining, daily } = data;
  const isCritical = usage_percent > 90;
  const isWarning = usage_percent >= 75;
  const accent = isCritical ? "#DC2626" : isWarning ? "#D97706" : "#6C5CE7";
  const accentBg = isCritical ? "#FEF2F2" : isWarning ? "#FFFBEB" : "#F5F3FF";
  const accentBorder = isCritical ? "#FECACA" : isWarning ? "#FDE68A" : "#DDD6FE";
  const trackBg = isCritical ? "#FEE2E2" : isWarning ? "#FEF3C7" : "#EDE9FE";

  // Circle
  const R = 38;
  const C = 2 * Math.PI * R;
  const pct = Math.min(usage_percent, 100);
  const offset = C - (pct / 100) * C;

  return (
    <div style={{ margin: "0 28px", marginBottom: 0 }}>
      <div style={{
        background: "white", border: `1px solid ${accentBorder}`, borderRadius: 12,
        padding: "18px 22px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap",
      }}>
        {/* Circle */}
        <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="45" cy="45" r={R} fill="none" stroke={trackBg} strokeWidth="8" />
            <circle cx="45" cy="45" r={R} fill="none" stroke={accent} strokeWidth="8"
              strokeDasharray={C} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }} />
          </svg>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: accent, lineHeight: 1, fontFamily: "var(--font-dm-mono, monospace)" }}>
              {pct.toFixed(0)}%
            </div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2 }}>verbraucht</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>
            Kontingent {month_name} {year}
          </div>

          {/* Progress Bar */}
          <div style={{ height: 8, background: trackBg, borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
            <div style={{
              height: "100%", borderRadius: 99, background: accent,
              width: `${pct}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: accent, fontFamily: "var(--font-dm-mono, monospace)", lineHeight: 1 }}>
                {remaining_minutes.toFixed(1)}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>Min. übrig</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#475569", fontFamily: "var(--font-dm-mono, monospace)", lineHeight: 1 }}>
                {used_minutes.toFixed(1)}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>von {quota_minutes} Min.</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#475569", fontFamily: "var(--font-dm-mono, monospace)", lineHeight: 1 }}>
                {total_calls}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>Anrufe</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#475569", fontFamily: "var(--font-dm-mono, monospace)", lineHeight: 1 }}>
                {days_remaining}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>Tage übrig</div>
            </div>
          </div>
        </div>

        {/* Warning Badge */}
        {isCritical && (
          <div style={{ padding: "8px 14px", background: "#FEF2F2", borderRadius: 8, border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>⚠️ Kontingent fast erschöpft!</div>
            <div style={{ fontSize: 11, color: "#DC2626", opacity: 0.8 }}>Noch {remaining_minutes.toFixed(0)} Minuten übrig</div>
          </div>
        )}
        {isWarning && !isCritical && (
          <div style={{ padding: "8px 14px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>⏳ {usage_percent.toFixed(0)}% verbraucht</div>
            <div style={{ fontSize: 11, color: "#D97706", opacity: 0.8 }}>{days_remaining} Tage verbleibend</div>
          </div>
        )}
      </div>

      {/* Daily Toggle */}
      {daily && daily.length > 0 && (
        <div style={{ margin: "0 0 0 0" }}>
          <button onClick={() => setShowDaily(!showDaily)} style={{
            fontSize: 11, color: "#94A3B8", background: "none", border: "none", cursor: "pointer",
            padding: "6px 0", fontFamily: "inherit", fontWeight: 500,
          }}>
            {showDaily ? "▾ Tagesdetails ausblenden" : "▸ Tagesdetails anzeigen"}
          </button>

          {showDaily && (
            <div style={{
              background: "white", border: `1px solid ${accentBorder}`, borderRadius: 10,
              padding: "12px 16px", marginTop: 4,
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {daily.map((d: any) => {
                  const dayPct = quota_minutes >= 0 ? (d.minutes / quota_minutes) * 100 : 0;
                  const dateStr = new Date(d.date + "T00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
                  return (
                    <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
                      <div style={{ width: 70, fontSize: 11, color: "#64748B", fontWeight: 500 }}>{dateStr}</div>
                      <div style={{ flex: 1, height: 6, background: trackBg, borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 99, background: accent, width: `${Math.min(dayPct * 3, 100)}%`, opacity: 0.7 }} />
                      </div>
                      <div style={{ width: 55, textAlign: "right", fontSize: 11, color: "#475569", fontFamily: "var(--font-dm-mono, monospace)", fontWeight: 600 }}>
                        {d.minutes} Min
                      </div>
                      <div style={{ width: 30, textAlign: "right", fontSize: 10, color: "#94A3B8" }}>
                        {d.calls}×
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
