"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("./db");
const upsert_1 = require("./upsert");
const logger_1 = require("./logger");
const wikipedia_1 = require("./sources/wikipedia");
const hn_1 = require("./sources/hn");
const producthunt_1 = require("./sources/producthunt");
const apple_1 = require("./sources/apple");
const coingecko_1 = require("./sources/coingecko");
async function runOnce() {
    const start = Date.now();
    const [w, hnf, hnn, ph, ap, cg] = await Promise.all([
        (0, wikipedia_1.fetchWikipediaTop)().catch(() => []),
        (0, hn_1.fetchHNFrontPage)().catch(() => []),
        (0, hn_1.fetchHNNewest)().catch(() => []),
        (0, producthunt_1.fetchProductHunt)(process.env.PH_TOKEN || "").catch(() => []),
        (0, apple_1.fetchAppleCharts)(process.env.REGION_DEFAULT || "US").catch(() => []),
        (0, coingecko_1.fetchCoinGeckoTrending)().catch(() => [])
    ]);
    const all = [...w, ...hnf, ...hnn, ...ph, ...ap, ...cg];
    if (all.length) {
        await (0, upsert_1.upsertSignals)(all);
    }
    logger_1.log.info({
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
    await (0, db_1.initDb)();
    await runOnce();
    // Every 15 minutes for "freshness" sources; Wikipedia is daily but harmless to re-run due to dedupe.
    node_cron_1.default.schedule("*/15 * * * *", runOnce);
    logger_1.log.info("TrenderAI Fresh Sources started - running every 15 minutes");
}
main().catch((e) => {
    logger_1.log.error(e, "fatal");
    process.exit(1);
});
//# sourceMappingURL=index.js.map