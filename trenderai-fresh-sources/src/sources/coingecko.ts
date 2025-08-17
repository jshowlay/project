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
