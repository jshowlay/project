import { NextResponse } from "next/server";
import { query } from "@/server/db";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const v = await query<{ version: string }>("select version()");
    const c = await query<{ source: string; rows: number }>(
      "select source, count(*)::int as rows from signals group by source order by rows desc"
    );
    return NextResponse.json({ ok: true, version: v[0]?.version, sources: c });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || "db error" }, { status: 500 });
  }
}
