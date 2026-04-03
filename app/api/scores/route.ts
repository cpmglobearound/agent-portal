import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_API_TOKEN || "";

export async function GET(req: NextRequest) {
  const session = await getSession(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const dbId = req.nextUrl.searchParams.get("db");
  if (!dbId) {
    return NextResponse.json({ error: "Missing db parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sorts: [{ property: "start_time", direction: "descending" }],
        page_size: 100,
      }),
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || "Notion API error" }, { status: res.status });
    }

    const data = await res.json();

    const SCORE_KEYS = [
      "overall_call_quality_score_1_10",
      "agent_professionalism_score_1_10",
      "empathy_score_1_10",
      "clarity_communication_score_1_10",
      "call_control_score_1_10",
      "product_knowledge_score_1_10",
      "process_adherence_score_1_10",
      "problem_resolution_score_1_10",
      "next_step_clarity_score_1_10",
      "customer_mood_score_1_10",
      "upsell_cross_sell_opportunity_score_1_10",
      "lead_quality_score_1_10",
    ];

    const calls = data.results.map((page: any) => {
      const p = page.properties;
      const call: any = { id: page.id };
      call.call_id = p.call_id?.title?.[0]?.plain_text || "—";
      call.start_time = p.start_time?.date?.start || null;
      call.end_time = p.end_time?.date?.start || null;
      call.duration = p.duration_formatted?.rich_text?.[0]?.plain_text || "—";
      call.duration_seconds = p.duration_seconds?.number || 0;
      call.caller_name = p.caller_name?.rich_text?.[0]?.plain_text || "Unbekannt";
      call.caller_phone = p.caller_phone?.rich_text?.[0]?.plain_text || "—";
      call.call_result = p.call_result?.rich_text?.[0]?.plain_text || "—";
      call.call_category = p.call_category?.rich_text?.[0]?.plain_text || "—";
      call.transcript_summary = p.transcript_summary?.rich_text?.[0]?.plain_text || "—";
      call.sentiment = p.sentiment?.rich_text?.[0]?.plain_text || "—";
      call.language = p.language?.select?.name || "de";
      call.total_turns = p.total_turns?.number || 0;
      for (const key of SCORE_KEYS) {
        call[key] = p[key]?.number ?? null;
      }
      return call;
    });

    // Deduplicate by call_id
    const seen = new Set();
    const unique = calls.filter((c: any) => {
      if (seen.has(c.call_id)) return true;
      seen.add(c.call_id);
      return false;
    });

    return NextResponse.json({ calls: unique });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
