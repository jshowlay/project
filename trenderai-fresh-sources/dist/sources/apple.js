"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAppleCharts = fetchAppleCharts;
// Apple App Store RSS (Top Free/Top Paid apps, US)
const utils_1 = require("../utils");
async function fetchAppleCharts(region = "US") {
    const bucket = (0, utils_1.floorToMinute)();
    const base = `https://rss.applemarketingtools.com/api/v2/${region.toLowerCase()}/apps`;
    const urls = [
        `${base}/top-free/50/apps.json`,
        `${base}/top-paid/50/apps.json`
    ];
    const out = [];
    for (const u of urls) {
        const data = await (0, utils_1.getJson)(u);
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
//# sourceMappingURL=apple.js.map