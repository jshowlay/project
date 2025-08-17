"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWikipediaTop = fetchWikipediaTop;
// Wikipedia Pageviews Top (Most Read) for yesterday, en.wikipedia
const utils_1 = require("../utils");
async function fetchWikipediaTop() {
    const now = new Date();
    const y = new Date(now.getTime() - 24 * 60 * 60 * 1000); // yesterday
    const yyyy = y.getUTCFullYear();
    const mm = String(y.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(y.getUTCDate()).padStart(2, "0");
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${yyyy}/${mm}/${dd}`;
    const data = await (0, utils_1.getJson)(url);
    const articles = data?.items?.[0]?.articles || [];
    const bucket = (0, utils_1.floorToMinute)();
    return articles.slice(0, 100).map(a => ({
        source: "wikipedia",
        entity_id: a.article,
        entity_name: decodeURIComponent(a.article.replace(/_/g, " ")),
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
//# sourceMappingURL=wikipedia.js.map