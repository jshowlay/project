#!/bin/bash

# Create wikipedia.ts
cat > src/sources/wikipedia.ts << 'WIKI_EOF'
// Wikipedia Pageviews Top (Most Read) for yesterday, en.wikipedia
import { getJson, floorToMinute } from "../utils";
import { SignalRow } from "../types";

export async function fetchWikipediaTop(): Promise<SignalRow[]> {
  const now = new Date();
  const y = new Date(now.getTime() - 24*60*60*1000); // yesterday
  const yyyy = y.getUTCFullYear();
  const mm = String(y.getUTCMonth()+1).padStart(2, "0");
  const dd = String(y.getUTCDate()).padStart(2, "0");
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${yyyy}/${mm}/${dd}`;
  
  type Resp = { items: { articles: { article: string; views: number; rank: number }[] }[] };
  const data = await getJson<Resp>(url);
  const articles = data?.items?.[0]?.articles || [];
  const bucket = floorToMinute();
  
  return articles.slice(0, 100).map(a => ({
    source: "wikipedia",
    entity_id: a.article,
    entity_name: decodeURIComponent(a.article.replace(/_/g," ")),
    metric: "pageviews.rank",
    value: a.rank,
    unit: "rank",
    window: "1d",
    region: "global",
    url: `https://en.wikipedia.org/wiki/${a.article}`,
    raw: a,
    bucket_min: bucket
  }));
}
WIKI_EOF

# Create hn.ts
cat > src/sources/hn.ts << 'HN_EOF'
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
HN_EOF

# Create producthunt.ts
cat > src/sources/producthunt.ts << 'PH_EOF'
// Product Hunt GraphQL v2: today's posts with votes/comments
import axios from "axios";
import { floorToMinute } from "../utils";
import { SignalRow } from "../types";

const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

export async function fetchProductHunt(token: string): Promise<SignalRow[]> {
  if (!token) return [];
  
  const q = `
    query Today($after: DateTime!) {
      posts(order: RANKING, postedAfter: $after, first: 100) {
        edges {
          node { id name slug votesCount commentsCount createdAt url }
        }
      }
    }`;
  
  const postedAfter = new Date();
  postedAfter.setUTCHours(0,0,0,0);
  
  const res = await axios.post(ENDPOINT, { 
    query: q, 
    variables: { after: postedAfter.toISOString() } 
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const edges = res.data?.data?.posts?.edges || [];
  const bucket = floorToMinute();
  const rows: SignalRow[] = [];
  
  for (const e of edges) {
    const n = e.node;
    rows.push({
      source: "producthunt",
      entity_id: n.id,
      entity_name: n.name,
      metric: "votes",
      value: Number(n.votesCount || 0),
      unit: "votes",
      window: "today",
      url: n.url || `https://www.producthunt.com/posts/${n.slug}`,
      raw: n,
      bucket_min: bucket
    });
    rows.push({
      source: "producthunt",
      entity_id: n.id,
      entity_name: n.name,
      metric: "comments",
      value: Number(n.commentsCount || 0),
      unit: "comments",
      window: "today",
      url: n.url || `https://www.producthunt.com/posts/${n.slug}`,
      raw: n,
      bucket_min: bucket
    });
  }
  
  return rows;
}
PH_EOF

# Create apple.ts
cat > src/sources/apple.ts << 'APPLE_EOF'
// Apple App Store RSS (Top Free/Top Paid apps, US)
import { getJson, floorToMinute } from "../utils";
import { SignalRow } from "../types";

type AppleFeed = { feed: { results: { id: string; name: string; url: string }[] } };

export async function fetchAppleCharts(region = "US"): Promise<SignalRow[]> {
  const bucket = floorToMinute();
  const base = `https://rss.applemarketingtools.com/api/v2/${region.toLowerCase()}/apps`;
  const urls = [
    `${base}/top-free/50/apps.json`,
    `${base}/top-paid/50/apps.json`
  ];
  
  const out: SignalRow[] = [];
  
  for (const u of urls) {
    const data = await getJson<AppleFeed>(u);
    const list = data?.feed?.results || [];
    const metric = u.includes("top-free") ? "rank.top_free" : "rank.top_paid";
    
    list.forEach((app, idx) => {
      out.push({
        source: "apple_appstore",
        entity_id: app.id,
        entity_name: app.name,
        metric,
        value: idx + 1,
        unit: "rank",
        window: "now",
        region,
        url: app.url,
        raw: app,
        bucket_min: bucket
      });
    });
  }
  
  return out;
}
APPLE_EOF

# Create coingecko.ts
cat > src/sources/coingecko.ts << 'CG_EOF'
// CoinGecko Trending Search (no key required)
import { getJson, floorToMinute } from "../utils";
import { SignalRow } from "../types";

type CGResp = { coins: { item: { id: string; name: string; symbol: string; market_cap_rank?: number } }[] };

export async function fetchCoinGeckoTrending(): Promise<SignalRow[]> {
  const data = await getJson<CGResp>("https://api.coingecko.com/api/v3/search/trending");
  const bucket = floorToMinute();
  const coins = data?.coins || [];
  
  return coins.map((c, idx) => ({
    source: "coingecko",
    entity_id: c.item.id,
    entity_name: `${c.item.name} (${c.item.symbol})`,
    metric: "search.trending_rank",
    value: idx + 1,
    unit: "rank",
    window: "24h",
    url: `https://www.coingecko.com/en/coins/${c.item.id}`,
    raw: c.item,
    bucket_min: bucket
  }));
}
CG_EOF

echo "Source files created successfully!"
