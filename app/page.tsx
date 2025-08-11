'use client';
import { useEffect, useState } from 'react';

type Item = {
  id:string; source:string; topic:string; score:number; delta24h?:number|null;
  url?:string|null; region?:string|null; tags?:string[]; observedAt:string;
};

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (source) params.set('source', source);
    const res = await fetch(`/api/trends?${params.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }
  useEffect(()=>{ load() },[]);

  return (
    <div className="min-h-screen" style={{ background:'#000', color:'#fff' }}>
      <div className="mx-auto max-w-5xl p-6">
        <h1 className="text-3xl font-semibold" style={{ color:'#e5c35a' }}>TrenderAI Dashboard</h1>
        <div className="mt-4 flex gap-3">
          <input
            value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search topic…" className="px-3 py-2 rounded-xl text-black w-full"
          />
          <select value={source} onChange={e=>setSource(e.target.value)} className="px-3 py-2 rounded-xl text-black">
            <option value="">All sources</option>
            <option value="reddit">Reddit</option>
            <option value="youtube">YouTube</option>
            <option value="newsapi">News</option>
            <option value="coingecko">CoinGecko</option>
            <option value="alphavantage">Alpha Vantage</option>
          </select>
          <button onClick={load} className="px-4 py-2 rounded-xl font-medium" style={{ background:'#e5c35a', color:'#000' }}>
            {loading ? 'Loading…' : 'Apply'}
          </button>
        </div>

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
                {(it.tags??[]).slice(0,5).map(tag=>(
                  <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background:'#222' }}>#{tag}</span>
                ))}
              </div>
              {it.url && <a href={it.url} target="_blank" className="mt-3 inline-block underline" style={{ color:'#e5c35a' }}>Open</a>}
            </div>
          ))}
        </div>
        {items.length===0 && !loading && <div className="mt-10 opacity-80">No items yet. Try ingesting data or adjusting filters.</div>}
      </div>
    </div>
  );
}
