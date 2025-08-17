import { NextResponse } from "next/server";
import { query } from "@/server/db";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await query<{ source: string; cnt: number }>(
      `SELECT source, COUNT(*)::int cnt FROM signals GROUP BY source ORDER BY cnt DESC`
    );
    return NextResponse.json({ ok: true, sources: rows });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Database error" }, { status: 500 });
  }
}
