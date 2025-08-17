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
