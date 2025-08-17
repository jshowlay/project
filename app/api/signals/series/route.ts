import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const entity_id = searchParams.get("entity_id");
  const metric = searchParams.get("metric");
  const hours = Math.min(parseInt(searchParams.get("hours") || "24", 10), 168);

  if (!entity_id || !metric) {
    return NextResponse.json({ ok: false, error: "entity_id and metric required" }, { status: 400 });
  }

  const rows = await query<any>(`
    SELECT bucket_min AS t, AVG(value) AS v
    FROM signals
    WHERE entity_id = $1 AND metric = $2 AND bucket_min >= NOW() - ($3 || ' hours')::interval
    GROUP BY t
    ORDER BY t ASC
  `, [entity_id, metric, String(hours)]);

  return NextResponse.json({ ok: true, series: rows });
}
