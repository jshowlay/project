"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProductHunt = fetchProductHunt;
// Product Hunt GraphQL v2: today's posts with votes/comments
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils");
const ENDPOINT = "https://api.producthunt.com/v2/api/graphql";
async function fetchProductHunt(token) {
    if (!token)
        return [];
    const q = `
    query Today($after: DateTime!) {
      posts(order: RANKING, postedAfter: $after, first: 100) {
        edges {
          node { id name slug votesCount commentsCount createdAt url }
        }
      }
    }`;
    const postedAfter = new Date();
    postedAfter.setUTCHours(0, 0, 0, 0);
    const res = await axios_1.default.post(ENDPOINT, {
        query: q,
        variables: { after: postedAfter.toISOString() }
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const edges = res.data?.data?.posts?.edges || [];
    const bucket = (0, utils_1.floorToMinute)();
    const rows = [];
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
//# sourceMappingURL=producthunt.js.map