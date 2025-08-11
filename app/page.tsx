'use client';
import { useEffect, useRef, useState } from 'react';
import { parseQueryDetailed, QueryToken } from '../src/search/query';

type Item = {
  id: string; source: string; topic: string; score: number; delta24h?: number | null;
  url?: string | null; region?: string | null; tags?: string; observedAt: string;
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

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');                 // raw input string (may include operators)
  const [uiSource, setUiSource] = useState('');   // dropdown source (explicit param)
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Parse tokens (for chips) and the remaining free text
  const { parsed, tokens } = parseQueryDetailed(q);

  async function load(nextPage = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Send raw q (operators will be parsed by API), plus explicit uiSource if set
      if (q.trim()) params.set('q', q.trim());
      if (uiSource) params.set('source', uiSource);
      params.set('page', String(nextPage));
      params.set('limit', '50');
      
      const res = await fetch(`/api/trends?${params.toString()}`, { cache: 'no-store' });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('API response:', data); // Debug log
      setItems(data.items ?? []);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load trends:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Debounce q + uiSource
  const debounce = useRef<number | null>(null);
  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => load(1), 300);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, uiSource]);

  useEffect(() => { load(1); }, []); // initial load

  // Remove a single token by slicing it out of the input and cleaning spaces
  function removeToken(t: QueryToken) {
    const before = q.slice(0, t.start);
    const after = q.slice(t.end);
    const next = (before + ' ' + after).replace(/\s+/g, ' ').trim();
    setQ(next);
  }

  // Clear all (only the operator tokens; keep free text if desired)
  function clearAllTokens() {
    // remove all tokens by keeping only parsed.text
    setQ(parsed.text);
    setUiSource('');
  }

  return (
    <div className="min-h-screen" style={{ background:'#000', color:'#fff' }}>
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-semibold" style={{ color:'#e5c35a' }}>TrenderAI Dashboard</h1>

        {/* Search bar + Source dropdown */}
        <div className="mt-4 flex gap-3">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === 'Enter') load(1); }}
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
          <button onClick={()=>load(1)} className="px-4 py-2 rounded-xl font-medium" style={{ background:'#e5c35a', color:'#000' }}>
            {loading ? 'Loading…' : 'Search'}
          </button>
        </div>

        {/* Active operator chips */}
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
                    {(it.tags ? it.tags.split(',').slice(0,5) : []).map(tag=>(
                      <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background:'#222' }}>#{tag.trim()}</span>
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
