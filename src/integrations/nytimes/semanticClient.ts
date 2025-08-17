import 'dotenv/config';

const BASE = 'https://api.nytimes.com';

function buildURL(path: string, params: Record<string, any> = {}) {
  const u = new URL(path, BASE);
  u.searchParams.set('api-key', process.env.NYT_API_KEY!);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function get<T=any>(path: string, params?: Record<string, any>): Promise<T> {
  const url = buildURL(path, params);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/**
 * TimesTags suggestion service.
 * Typical usage: suggest("openai") -> ranked list of canonical NYT tags with types like nytd_per|nytd_org|nytd_geo|nytd_des
 * API returns an array of arrays; we normalize below.
 */
export async function timesTagsSuggest(query: string, max = Number(process.env.NYT_SEMANTIC_MAX_RESULTS || 10)) {
  // Known public pattern for TimesTags suggestion endpoint:
  // /svc/suggest/v1/timestags?query=<q>&max=<n>
  const raw = await get<any>('/svc/suggest/v1/timestags', { query, max });
  // Normalize to objects: { name, type, alt }
  // Responses are typically arrays like ["Obama, Barack","nytd_per","Obama, Barack","Obama, Barack (1961- )"]
  const items = Array.isArray(raw) ? raw : raw?.results || raw?.response || [];
  return (items as any[]).map((row: any) => {
    if (Array.isArray(row)) {
      const [name, type, displayName, alt] = row;
      return { name: name || displayName, type, alt: alt || displayName };
    }
    return row;
  });
}

/**
 * Semantic concept lookup (optional deep details by type/name).
 * Endpoint pattern (varies by concept type in NYT specs):
 * /svc/semantic/v2/concept/{type}/{name}.json
 */
export async function semanticConcept(type: 'nytd_per'|'nytd_org'|'nytd_geo'|'nytd_des', name: string) {
  // Name should be URL-encoded; NYT expects canonical label e.g., "OpenAI" or "United States Economy"
  const path = `/svc/semantic/v2/concept/${encodeURIComponent(type)}/${encodeURIComponent(name)}.json`;
  return get<any>(path);
}
