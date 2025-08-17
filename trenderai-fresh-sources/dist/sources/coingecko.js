"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCoinGeckoTrending = fetchCoinGeckoTrending;
// CoinGecko Trending Search (no key required)
const utils_1 = require("../utils");
async function fetchCoinGeckoTrending() {
    const data = await (0, utils_1.getJson)("https://api.coingecko.com/api/v3/search/trending");
    const bucket = (0, utils_1.floorToMinute)();
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
//# sourceMappingURL=coingecko.js.map