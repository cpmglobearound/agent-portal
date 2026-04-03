import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_API_TOKEN || "";

export async function GET(req: NextRequest) {
  const session = await getSession(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = req.nextUrl.searchParams.get("db");
  const quota = req.nextUrl.searchParams.get("quota");

  if (!db || !quota) {
    return NextResponse.json({ error: "Missing db or quota param" }, { status: 400 });
  }

  const quotaMinutes = parseFloat(quota) || 0;

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstOfNextMonth = new Date(year, month + 1, 1);
    const startISO = firstOfMonth.toISOString();
    const endISO = firstOfNextMonth.toISOString();

    let allResults: any[] = [];
    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const body: any = {
        page_size: 100,
        filter: {
          and: [
            { property: "start_time", date: { on_or_after: startISO } },
            { property: "start_time", date: { before: endISO } },
          ],
        },
      };
      if (startCursor) body.start_cursor = startCursor;

      const res = await fetch(`https://api.notion.com/v1/databases/${db}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        next: { revalidate: 60 },
      });

      if (!res.ok) { console.error("Notion error:", await res.text()); break; }
      const data = await res.json();
      allResults = allResults.concat(data.results || []);
      hasMore = data.has_more || false;
      startCursor = data.next_cursor || undefined;
    }

    let totalSeconds = 0;
    let totalCalls = 0;
    const dailyUsage: Record<string, { seconds: number; calls: number }> = {};

    for (const page of allResults) {
      const props = page.properties;
      const seconds = typeof props?.duration_seconds?.number === "number" ? props.duration_seconds.number : 0;
      const startTime = props?.start_time?.date?.start;
      const day = startTime ? startTime.substring(0, 10) : "unknown";

      totalSeconds += seconds;
      totalCalls++;

      if (!dailyUsage[day]) dailyUsage[day] = { seconds: 0, calls: 0 };
      dailyUsage[day].seconds += seconds;
      dailyUsage[day].calls++;
    }

    const usedMinutes = totalSeconds / 60;
    const remainingMinutes = Math.max(0, quotaMinutes - usedMinutes);
    const usagePercent = quotaMinutes > 0 ? (usedMinutes / quotaMinutes) * 100 : 0;

    const daily = Object.entries(dailyUsage)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date, minutes: Math.round((d.seconds / 60) * 10) / 10, calls: d.calls }));

    // Days remaining in month
    const lastDay = new Date(year, month + 1, 0).getDate();
    const daysRemaining = lastDay - now.getDate();

    return NextResponse.json({
      quota_minutes: quotaMinutes,
      used_minutes: Math.round(usedMinutes * 10) / 10,
      remaining_minutes: Math.round(remainingMinutes * 10) / 10,
      usage_percent: Math.round(usagePercent * 10) / 10,
      total_calls: totalCalls,
      total_seconds: Math.round(totalSeconds),
      month: `${year}-${String(month + 1).padStart(2, "0")}`,
      month_name: ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"][month],
      year,
      days_remaining: daysRemaining,
      daily,
    });
  } catch (err: any) {
    console.error("Quota API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
