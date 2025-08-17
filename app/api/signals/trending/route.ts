import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const windowParam = (searchParams.get("window") || "1h").toLowerCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
  const region = searchParams.get("region") || "";
  const sources = (searchParams.get("sources") || "").split(",").map(s => s.trim()).filter(Boolean);

  // Use trending_now view; rank by score desc
  const filters: string[] = [];
  const params: any[] = [];

  if (region) {
    params.push(region);
    filters.push(`COALESCE(region,'') = $${params.length}`);
  }
  if (sources.length) {
    params.push(sources);
    filters.push(`source = ANY($${params.length})`);
  }

  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const rows = await query<any>(`
    SELECT source, entity_id, entity_name, metric, region, now_value, baseline_value,
           score, NOW() AS as_of
    FROM trending_now
    ${where}
    ORDER BY score DESC NULLS LAST
    LIMIT ${limit}
  `, params);

  return NextResponse.json({ ok: true, count: rows.length, rows });
}
