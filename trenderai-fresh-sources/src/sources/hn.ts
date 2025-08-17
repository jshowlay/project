// Hacker News via Algolia: front page + newest by date
import { getJson, floorToMinute } from "../utils";
import { SignalRow } from "../types";

type Hit = { objectID: string; title: string; url?: string; points?: number; num_comments?: number };

export async function fetchHNFrontPage(): Promise<SignalRow[]> {
  const data = await getJson<{ hits: Hit[] }>("https://hn.algolia.com/api/v1/search?tags=front_page");
  const bucket = floorToMinute();
  
  return (data.hits || []).map((h, i) => ({
    source: "hackernews",
    entity_id: h.objectID,
    entity_name: h.title || "",
    metric: "frontpage.rank",
    value: i + 1,
    unit: "rank",
    window: "now",
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    raw: h,
    bucket_min: bucket
  }));
}

export async function fetchHNNewest(): Promise<SignalRow[]> {
  const data = await getJson<{ hits: Hit[] }>("https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=50");
  const bucket = floorToMinute();
  
  return (data.hits || []).flatMap((h) => {
    const base: Omit<SignalRow,"metric"|"value"> = {
      source: "hackernews",
      entity_id: h.objectID,
      entity_name: h.title || "",
      window: "recent",
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      raw: h,
      bucket_min: bucket
    } as any;
    
    return [
      { ...base, metric: "points", value: h.points ?? 0, unit: "points" },
      { ...base, metric: "comments", value: h.num_comments ?? 0, unit: "comments" }
    ] as SignalRow[];
  });
}
