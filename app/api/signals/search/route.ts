import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

  if (!q) return NextResponse.json({ ok: true, rows: [] });

  const rows = await query<any>(`
    SELECT DISTINCT ON (entity_id) entity_id, entity_name, source, metric, region, url
    FROM signals
    WHERE (entity_name ILIKE $1 OR entity_id ILIKE $1)
    ORDER BY entity_id, captured_at DESC
    LIMIT ${limit}
  `, [`%${q}%`]);

  return NextResponse.json({ ok: true, rows });
}
