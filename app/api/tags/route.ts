import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();

  // Get all tags and process them in JavaScript since SQLite doesn't have good string splitting
  const allRecords = await prisma.trendRecord.findMany({
    select: { tags: true }
  });

  // Process tags in JavaScript
  const tagCounts = new Map<string, number>();
  
  for (const record of allRecords) {
    if (record.tags && Array.isArray(record.tags)) {
      for (const tag of record.tags) {
        const lowerTag = tag.toLowerCase();
        if (q === '' || lowerTag.includes(q.toLowerCase())) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }
  }

  // Convert to array and sort by count
  const rows = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, cnt: BigInt(count) }))
    .sort((a, b) => Number(b.cnt) - Number(a.cnt))
    .slice(0, 50);

  return NextResponse.json({
    tags: rows.map(r => ({ tag: r.tag, count: Number(r.cnt) }))
  });
}
