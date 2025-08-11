'use client';
import { useEffect, useRef, useState } from 'react';

type Item = {
  id: string; source: string; topic: string; score: number; delta24h?: number | null;
  url?: string | null; region?: string | null; tags?: string; observedAt: string;
};

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  async function load(nextPage = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (source) params.set('source', source);
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

  // Debounce search input (300ms)
  const debounce = useRef<number | null>(null);
  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => load(1), 300);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, source]);

  useEffect(() => { load(1); }, []); // initial load

  return (
    <div className="min-h-screen" style={{ background:'#000', color:'#fff' }}>
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-semibold" style={{ color:'#e5c35a' }}>TrenderAI Dashboard</h1>
        <div className="mt-4 flex gap-3">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === 'Enter') load(1); }}
            placeholder="Search (e.g., ai agents OR robotics -crypto)…"
            className="px-3 py-2 rounded-xl text-black w-full"
          />
          <select value={source} onChange={(e)=>setSource(e.target.value)} className="px-3 py-2 rounded-xl text-black">
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

        {loading && (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#e5c35a' }}></div>
            <div className="mt-2 opacity-80">Loading trends...</div>
          </div>
        )}

        {!loading && (
          <>
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
