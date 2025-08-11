export type RecentSearch = {
  id: string;        // cuid-ish or timestamp-based
  query: string;     // the full q string (operators + text)
  ts: number;        // epoch ms
  pinned?: boolean;
};

const KEY = 'trenderai:recentSearches';
const MAX = 15;

function isBrowser() { return typeof window !== 'undefined' && !!window.localStorage; }

function normalizeQuery(q: string) {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function getRecents(): RecentSearch[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) as RecentSearch[] : [];
    if (!Array.isArray(list)) return [];
    // basic shape guard
    return list
      .filter(it => typeof it?.query === 'string' && typeof it?.ts === 'number')
      .sort((a, b) => (b.pinned === true ? 1 : 0) - (a.pinned === true ? 1 : 0) || b.ts - a.ts);
  } catch {
    return [];
  }
}

function putRecents(list: RecentSearch[]) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export function saveRecent(query: string): RecentSearch[] {
  if (!isBrowser()) return [];
  const q = query.trim();
  if (q.length < 2) return getRecents(); // ignore super short/empty
  const now = Date.now();
  const norm = normalizeQuery(q);

  let list = getRecents();
  // dedupe by normalized string
  const existingIdx = list.findIndex(r => normalizeQuery(r.query) === norm);
  if (existingIdx > -1) {
    // update timestamp; preserve pin
    const ex = list[existingIdx];
    list.splice(existingIdx, 1);
    list.unshift({ ...ex, query: q, ts: now });
  } else {
    const id = `r_${now}_${Math.random().toString(36).slice(2, 7)}`;
    list.unshift({ id, query: q, ts: now });
  }
  // cap and persist
  if (list.length > MAX) list = list.slice(0, MAX);
  putRecents(list);
  return list;
}

export function removeRecent(id: string): RecentSearch[] {
  if (!isBrowser()) return [];
  let list = getRecents().filter(r => r.id !== id);
  putRecents(list);
  return list;
}

export function clearRecents(): void {
  if (!isBrowser()) return;
  try { window.localStorage.removeItem(KEY); } catch {}
}

export function togglePin(id: string): RecentSearch[] {
  if (!isBrowser()) return [];
  const list = getRecents().map(r => r.id === id ? { ...r, pinned: !r.pinned } : r);
  // re-sort with pins first, then ts desc
  const sorted = list.sort((a, b) => (b.pinned === true ? 1 : 0) - (a.pinned === true ? 1 : 0) || b.ts - a.ts);
  putRecents(sorted);
  return sorted;
}
