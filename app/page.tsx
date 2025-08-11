'use client';
import { useEffect, useRef, useState } from 'react';
import { parseQueryDetailed, QueryToken } from '@/search/query';
import SearchSuggest from '@/components/SearchSuggest';
import { getRecents, saveRecent, removeRecent, clearRecents, togglePin, RecentSearch } from '@/search/recent';

function asTagArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (val == null) return [];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [val];
    } catch {
      return [val];
    }
  }
  return [];
}

type Item = {
  id: string; source: string; topic: string; score: number; delta24h?: number | null;
  url?: string | null; region?: string | null; tags?: string[]; observedAt: string;
};

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
      style={{ background:'#1a1a1a', border:'1px solid #333', color:'#fff' }}
    >
      {label}
      <button
        aria-label="Remove filter"
        onClick={onRemove}
        className="rounded-full px-2"
        style={{ background:'#222', color:'#e5c35a' }}
      >
        ✕
      </button>
    </span>
  );
}

function RecentChip({ r, onRun, onPin, onRemove }:{
  r: RecentSearch;
  onRun: (q:string)=>void; onPin:(id:string)=>void; onRemove:(id:string)=>void;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
      style={{ background:'#101010', border:'1px solid #222', color:'#fff' }}>
      <button onClick={()=>onRun(r.query)} className="truncate max-w-[14rem] text-left">
        {r.query}
      </button>
      <button
        title={r.pinned ? 'Unpin' : 'Pin'}
        onClick={()=>onPin(r.id)}
        className="rounded-full px-2"
        style={{ background:'#1a1a1a', color: r.pinned ? '#e5c35a' : '#aaa' }}
      >
        ★
      </button>
      <button
        title="Remove"
        onClick={()=>onRemove(r.id)}
        className="rounded-full px-2"
        style={{ background:'#1a1a1a', color:'#e5c35a' }}
      >
        ✕
      </button>
    </span>
  );
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [uiSource, setUiSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { parsed, tokens } = parseQueryDetailed(q);

  async function load(nextPage = 1, opts?: { commit?: boolean }) {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (uiSource) params.set('source', uiSource);
    params.set('page', String(nextPage));
    params.set('limit', '50');
    const res = await fetch(`/api/trends?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items ?? []);
    setPage(nextPage);
    setLoading(false);

    // Save to recents only on explicit commit (Enter/Search button) and non-empty q
    if (opts?.commit && q.trim().length >= 2) {
      setRecents(saveRecent(q));
    }
  }

  // Debounce q + uiSource for background search (without saving history)
  const debounce = useRef<number | null>(null);
  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => load(1, { commit: false }), 300);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, uiSource]);

  useEffect(() => {
    // initial load & pull recents
    setRecents(getRecents());
    load(1, { commit: false });
  }, []);

  function removeToken(t: QueryToken) {
    const before = q.slice(0, t.start);
    const after = q.slice(t.end);
    const next = (before + ' ' + after).replace(/\s+/g, ' ').trim();
    setQ(next);
    inputRef.current?.focus();
  }

  function clearAllTokens() {
    setQ(parsed.text);
    setUiSource('');
    inputRef.current?.focus();
  }

  function commitSearch() {
    // Called on Enter key or Search button
    load(1, { commit: true });
  }

  function runRecent(query: string) {
    setQ(query);
    inputRef.current?.focus();
    load(1, { commit: false }); // do not double-save; user can press Enter if they want it bumped
  }

  // Keyboard navigation into the suggestion list: handle up/down/enter/esc by proxy via custom events
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitSearch();
  }

  return (
    <div className="min-h-screen" style={{ background:'#000', color:'#fff' }}>
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-semibold" style={{ color:'#e5c35a' }}>TrenderAI Dashboard</h1>

        <div className="mt-4">
          {/* Wrap input in a relatively positioned container for the dropdown */}
          <div className="relative">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={()=>{/* suggestions will open automatically */}}
                placeholder="Search (e.g., ai agents OR robotics -crypto, tag:crypto source:reddit since:7d sort:score)…"
                className="px-3 py-2 rounded-xl text-black w-full"
              />
              <select
                value={uiSource}
                onChange={(e)=>setUiSource(e.target.value)}
                className="px-3 py-2 rounded-xl text-black"
                title="Filter by Source"
              >
                <option value="">All sources</option>
                <option value="reddit">Reddit</option>
                <option value="youtube">YouTube</option>
                <option value="newsapi">News</option>
                <option value="coingecko">CoinGecko</option>
                <option value="alphavantage">Alpha Vantage</option>
              </select>
              <button onClick={commitSearch} className="px-4 py-2 rounded-xl font-medium" style={{ background:'#e5c35a', color:'#000' }}>
                {loading ? 'Loading…' : 'Search'}
              </button>
            </div>

            {/* Suggest dropdown anchored to the input */}
            <SearchSuggest
              input={q}
              anchorRef={inputRef}
              onApply={(next)=> setQ(next)}
            />
          </div>
        </div>

        {/* Operator chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Chips from typed operators */}
          {tokens.map((t: QueryToken, idx: number) => {
            const labelMap: Record<string, string> = {
              tag: 'tag', source: 'source', region: 'region',
              since: 'since', until: 'until', before: 'before',
              sort: 'sort', score: 'score', delta24h: 'delta24h'
            };
            const label = `${labelMap[t.key] ?? t.key}:${t.value}`;
            return <Chip key={`${t.start}-${t.end}-${idx}`} label={label} onRemove={()=>removeToken(t)} />;
          })}

          {/* Chip for UI dropdown source */}
          {uiSource && (
            <Chip label={`source:${uiSource} (UI)`} onRemove={()=>setUiSource('')} />
          )}

          {(tokens.length > 0 || uiSource) && (
            <button
              onClick={clearAllTokens}
              className="underline text-sm"
              style={{ color:'#e5c35a' }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Recent searches row */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wide" style={{ color:'#e5c35a' }}>Recent searches</h2>
            {recents.length > 0 && (
              <button
                onClick={() => { if (confirm('Clear all recent searches?')) { clearRecents(); setRecents([]); } }}
                className="text-sm underline"
                style={{ color:'#e5c35a' }}
              >
                Clear history
              </button>
            )}
          </div>
          {recents.length === 0 ? (
            <div className="text-sm opacity-70">Your recent searches will appear here.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recents.map(r => (
                <RecentChip
                  key={r.id}
                  r={r}
                  onRun={runRecent}
                  onPin={(id)=> setRecents(togglePin(id))}
                  onRemove={(id)=> setRecents(removeRecent(id))}
                />
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#e5c35a' }}></div>
            <div className="mt-2 opacity-80">Loading trends...</div>
          </div>
        )}

        {!loading && (
          <>
            {/* Results grid */}
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {items.map(it=>(
                <div key={it.id} className="rounded-2xl p-4" style={{ background:'#111', border:'1px solid #222' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-wide" style={{ color:'#e5c35a' }}>{it.source}</span>
                    <span className="text-sm">Score: {Math.round(it.score)}</span>
                  </div>
                  <div className="mt-2 text-lg font-medium">{it.topic}</div>
                  <div className="mt-1 text-sm opacity-80">Observed: {new Date(it.observedAt).toLocaleString()}</div>
                  {it.delta24h!=null && <div className="mt-1 text-sm">Δ24h: {it.delta24h!.toFixed(2)}%</div>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {asTagArray(it.tags).slice(0, 5).map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background:'#222' }}>#{tag}</span>
                    ))}
                  </div>
                  {it.url && <a href={it.url} target="_blank" className="mt-3 inline-block underline" style={{ color:'#e5c35a' }}>Open</a>}
                </div>
              ))}
            </div>

            {items.length===0 && (
              <div className="mt-10 text-center">
                <div className="opacity-80 mb-4">No results found.</div>
                <div className="text-sm opacity-60">
                  {q ? `No trends match "${q}"` : 'No trends available'}
                </div>
                <div className="text-sm opacity-60 mt-2">
                  Try a different search term or check all sources.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
