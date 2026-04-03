import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AgentScores from "@/components/agent-scores";

const SEATABLE_AGENTS_KEY = "1cf0c86a0819fdf3255dbacf750b9e82adb23b27";

async function getAgentNotionDbId(agentId: string) {
  const tokenRes = await fetch("https://cloud.seatable.io/api/v2.1/dtable/app-access-token/", {
    headers: { Authorization: `Token ${SEATABLE_AGENTS_KEY}` },
    next: { revalidate: 300 },
  });
  const { access_token, dtable_uuid } = await tokenRes.json();
  const rowsRes = await fetch(
    `https://cloud.seatable.io/api-gateway/api/v2/dtables/${dtable_uuid}/rows/?table_name=agents&limit=100&convert_keys=true`,
    { headers: { Authorization: `Token ${access_token}` }, next: { revalidate: 300 } }
  );
  const { rows } = await rowsRes.json();
  const agent = rows?.find((r: any) => r.id === agentId || r.customer_id === agentId || r.service_name === agentId || r.agent_display_name === agentId);
  return { notionDbId: agent?.notion_database_id || null, agentName: agent?.agent_display_name || agentId };
}

export default async function ScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id: agentId } = await params;
  const { notionDbId, agentName } = await getAgentNotionDbId(agentId);

  if (!notionDbId) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 8 }}>Keine Scores konfiguriert</div>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>Für <strong>{agentName}</strong> ist keine Notion-Datenbank hinterlegt.</div>
          <a href={`/agent/${agentId}`} style={{ fontSize: 13, color: "#6C5CE7", textDecoration: "none", fontWeight: 600 }}>← Zurück zum Agent</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "white", borderBottom: "1px solid #E2E8F0", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <a href={`/agent/${agentId}`} style={{ fontSize: 13, color: "#64748B", textDecoration: "none", fontWeight: 500 }}>← {agentName}</a>
        <div style={{ width: 1, height: 16, background: "#E2E8F0" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>📊 Call Scores & Insights</div>
      </div>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
        <AgentScores notionDbId={notionDbId} agentName={agentName} />
      </div>
    </div>
  );
}
