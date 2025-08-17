import "dotenv/config";
import cron from "node-cron";
import { initDb } from "./db";
import { upsertSignals } from "./upsert";
import { log } from "./logger";
import { fetchWikipediaTop } from "./sources/wikipedia";
import { fetchHNFrontPage, fetchHNNewest } from "./sources/hn";
import { fetchProductHunt } from "./sources/producthunt";
import { fetchAppleCharts } from "./sources/apple";
import { fetchCoinGeckoTrending } from "./sources/coingecko";

async function runOnce() {
  const start = Date.now();
  
  const [w, hnf, hnn, ph, ap, cg] = await Promise.all([
    fetchWikipediaTop().catch(() => []),
    fetchHNFrontPage().catch(() => []),
    fetchHNNewest().catch(() => []),
    fetchProductHunt(process.env.PH_TOKEN || "").catch(() => []),
    fetchAppleCharts(process.env.REGION_DEFAULT || "US").catch(() => []),
    fetchCoinGeckoTrending().catch(() => [])
  ]);

  const all = [...w, ...hnf, ...hnn, ...ph, ...ap, ...cg];
  
  if (all.length) {
    await upsertSignals(all);
  }
  
  log.info({ 
    count: all.length, 
    ms: Date.now() - start,
    sources: {
      wikipedia: w.length,
      hn_front: hnf.length,
      hn_newest: hnn.length,
      producthunt: ph.length,
      apple: ap.length,
      coingecko: cg.length
    }
  }, "ingested");
}

async function main() {
  await initDb();
  await runOnce();
  
  // Every 15 minutes for "freshness" sources; Wikipedia is daily but harmless to re-run due to dedupe.
  cron.schedule("*/15 * * * *", runOnce);
  
  log.info("TrenderAI Fresh Sources started - running every 15 minutes");
}

main().catch((e) => {
  log.error(e, "fatal");
  process.exit(1);
});
