type Entities = { per?: string[]; org?: string[]; geo?: string[]; des?: string[] };
type SuggestHit = { name?: string; type?: string; alt?: string };

const bucket = (t?: string) => {
  switch (t) {
    case 'nytd_per': return 'per';
    case 'nytd_org': return 'org';
    case 'nytd_geo': return 'geo';
    default: return 'des';
  }
};

export function foldSuggestionsToEntities(suggestions: SuggestHit[]): Entities {
  const out: Entities = { per: [], org: [], geo: [], des: [] };
  for (const s of suggestions) {
    const key = bucket(s.type);
    const val = (s.name || s.alt || '').trim();
    if (val) (out as any)[key].push(val);
  }
  // de-dupe and prune empties
  for (const k of Object.keys(out) as (keyof Entities)[]) {
    const arr = Array.from(new Set((out[k] || []).filter(Boolean)));
    if (arr.length) out[k] = arr; else delete out[k];
  }
  return out;
}

export function mergeEntities(a: Entities | null | undefined, b: Entities | null | undefined): Entities | null {
  if (!a && !b) return null;
  const out: Entities = {};
  for (const k of ['per','org','geo','des'] as const) {
    const merged = [ ...(a?.[k] || []), ...(b?.[k] || []) ];
    if (merged.length) (out as any)[k] = Array.from(new Set(merged));
  }
  return Object.keys(out).length ? out : null;
}
