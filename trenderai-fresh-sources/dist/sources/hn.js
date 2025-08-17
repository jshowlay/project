"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchHNFrontPage = fetchHNFrontPage;
exports.fetchHNNewest = fetchHNNewest;
// Hacker News via Algolia: front page + newest by date
const utils_1 = require("../utils");
async function fetchHNFrontPage() {
    const data = await (0, utils_1.getJson)("https://hn.algolia.com/api/v1/search?tags=front_page");
    const bucket = (0, utils_1.floorToMinute)();
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
async function fetchHNNewest() {
    const data = await (0, utils_1.getJson)("https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=50");
    const bucket = (0, utils_1.floorToMinute)();
    return (data.hits || []).flatMap((h) => {
        const base = {
            source: "hackernews",
            entity_id: h.objectID,
            entity_name: h.title || "",
            window: "recent",
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            raw: h,
            bucket_min: bucket
        };
        return [
            { ...base, metric: "points", value: h.points ?? 0, unit: "points" },
            { ...base, metric: "comments", value: h.num_comments ?? 0, unit: "comments" }
        ];
    });
}
//# sourceMappingURL=hn.js.map