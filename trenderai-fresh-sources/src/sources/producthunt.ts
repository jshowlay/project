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
