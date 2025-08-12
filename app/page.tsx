'use client';
import { useEffect, useRef, useState } from 'react';
import { parseQueryDetailed, QueryToken } from '@/search/query';
import SearchSuggest from '@/components/SearchSuggest';
import {
  getRecents, saveRecent, removeRecent, clearRecents, togglePin,
  RecentSearch
} from '@/search/recent';
import { CATEGORIES, getCategory } from '@/categories/config';
import Logo from '@/components/Logo';
import TrendSparkline from '@/components/TrendSparkline';
import ShareButtons from '@/components/ShareButtons';
import CardImage from '@/components/CardImage';

type Item = {
  id?: string;
  source: string;
  topic: string;
  score: number;
  delta24h?: number | null;
  url?: string | null;
  region?: string | null;
  tags?: string[] | string | null;
  observedAt: string | Date;
  imageUrl?: string | null;   // NEW
};

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
      style={{ background:'#1a1a1a', border:'1px solid #333', color:'#fff' }}>
      {label}
      <button aria-label="Remove" onClick={onRemove} className="rounded-full px-2"
        style={{ background:'#222', color:'var(--accent)' }}>✕</button>
    </span>
  );
}

function RecentChip({ r, onRun, onPin, onRemove }:{
  r: RecentSearch; onRun:(q:string)=>void; onPin:(id:string)=>void; onRemove:(id:string)=>void;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
      style={{ background:'#101010', border:'1px solid #222', color:'#fff' }}>
      <button onClick={()=>onRun(r.query)} className="truncate max-w-[14rem] text-left">{r.query}</button>
      <button title={r.pinned ? 'Unpin' : 'Pin'} onClick={()=>onPin(r.id)} className="rounded-full px-2"
        style={{ background:'#1a1a1a', color: r.pinned ? 'var(--accent)' : '#aaa' }}>★</button>
      <button title="Remove" onClick={()=>onRemove(r.id)} className="rounded-full px-2"
        style={{ background:'#1a1a1a', color:'var(--accent)' }}>✕</button>
    </span>
  );
}

function asTagArray(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (val == null) return [];
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [val]; }
    catch { return [val]; }
  }
  return [];
}

function deriveTermAndGeo(topic: string, region?: string | null): { term: string; geo: string } {
  let t = topic || '';
  // remove region suffix like "Topic [US]"
  t = t.replace(/\s\[[A-Z]{2}\]$/, '');
  // remove suffix added by timeseries snapshot
  t = t.replace(/\s—\sinterest over time$/i, '');
  // trim quotes
  t = t.replace(/^"(.*)"$/, '$1').trim();
  const geo = (region && region.trim()) || 'US';
  return { term: t, geo };
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ background:'#111', border:'1px solid #222' }}>
      <div className="h-4 w-20 mb-2" style={{ background:'#222', borderRadius:6 }} />
      <div className="h-6 w-3/4 mb-2" style={{ background:'#222', borderRadius:6 }} />
      <div className="h-4 w-40" style={{ background:'#222', borderRadius:6 }} />
    </div>
  );
}

function Toast({ message, onClose }:{message:string; onClose:()=>void}) {
  if (!message) return null;
  return (
    <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl"
      style={{ background:'#1a1a1a', color:'#fff', border:'1px solid #333' }}>
      <div className="flex items-center gap-3">
        <span style={{ color:'var(--accent)' }}>⚠</span>
        <span className="text-sm">{message}</span>
        <button onClick={onClose} className="ml-3 underline text-sm" style={{ color:'var(--accent)' }}>Close</button>
      </div>
    </div>
  );
}

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState('');
  const [uiSource, setUiSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [catId, setCatId] = useState<string>(''); // NEW: selected category
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { parsed, tokens } = parseQueryDetailed(q);

  // --- URL helpers ---
  function buildUrl(nextQ: string, nextSource: string, nextCat: string) {
    const url = new URL(window.location.href);
    if (nextQ?.trim()) url.searchParams.set('q', nextQ.trim()); else url.searchParams.delete('q');
    if (nextSource) url.searchParams.set('source', nextSource); else url.searchParams.delete('source');
    if (nextCat) url.searchParams.set('cat', nextCat); else url.searchParams.delete('cat');
    url.searchParams.delete('page');
    return url;
  }
  function applyUrlState(replace = true) {
    const url = buildUrl(q, uiSource, catId);
    if (replace) window.history.replaceState({}, '', url.toString());
    else window.history.pushState({}, '', url.toString());
  }

  async function load(nextPage = 1, opts?: { commit?: boolean; pushHistory?: boolean; append?: boolean }) {
    console.log('Frontend: load() called with:', { nextPage, opts });
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (uiSource) params.set('source', uiSource);
      params.set('page', String(nextPage));
      params.set('limit', '50');

      const url = `/api/trends?${params.toString()}`;
      console.log('Fetching:', url);
      const res = await fetch(url, { cache: 'no-store' });
      console.log('Response status:', res.status, res.statusText);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      console.log('Response data:', data);
      const newItems = data.items ?? [];
      setItems(opts?.append ? [...items, ...newItems] : newItems);
      setTotal(Number(data.total ?? 0));
      setPage(nextPage);

      if (opts?.pushHistory) applyUrlState(false); else applyUrlState(true);
      if (opts?.commit && q.trim().length >= 2) setRecents(saveRecent(q));
    } catch (e:any) {
      console.error('Load error:', e);
      const errorMessage = e.message || 'Something went wrong. Please try again.';
      setError(errorMessage);
      try { const Sentry = require('@sentry/nextjs'); Sentry.captureException?.(e); } catch {}
    } finally {
      setLoading(false);
    }
  }

  // Debounce background search
  const debounce = useRef<number | null>(null);
  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => load(1, { commit: false, pushHistory: true }), 300);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, uiSource]);

  // Boot: read URL (?q, ?source, ?cat) and recents
  useEffect(() => {
    console.log('Frontend: Initial load useEffect running');
    const url = new URL(window.location.href);
    const initialQ = url.searchParams.get('q') ?? '';
    const initialSource = url.searchParams.get('source') ?? '';
    const initialCat = url.searchParams.get('cat') ?? '';
    console.log('Frontend: URL params:', { initialQ, initialSource, initialCat });
    if (initialQ) setQ(initialQ);
    if (initialSource) setUiSource(initialSource);
    if (initialCat) {
      const c = getCategory(initialCat);
      if (c) {
        setCatId(c.id);
        // If q not provided explicitly, apply the category's query
        if (!initialQ) setQ(c.query);
      }
    }
    setRecents(getRecents());
    console.log('Frontend: About to call load()');
    setTimeout(() => load(1, { commit: false, pushHistory: false }), 0);

    function onPop() {
      const u = new URL(window.location.href);
      setQ(u.searchParams.get('q') ?? '');
      setUiSource(u.searchParams.get('source') ?? '');
      const cid = u.searchParams.get('cat') ?? '';
      setCatId(cid);
      setTimeout(() => load(1, { commit: false, pushHistory: false }), 0);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  function commitSearch() { load(1, { commit: true, pushHistory: true }); }
  function runRecent(query: string) {
    setQ(query);
    setCatId(''); // manual search overrides category
    inputRef.current?.focus();
    load(1, { commit: false, pushHistory: true });
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commitSearch();
  }
  async function copyLink() {
    try {
      const url = buildUrl(q, uiSource, catId).toString();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  // --- Category selection ---
  function applyCategory(id: string) {
    const cat = getCategory(id);
    if (!cat) return;
    setCatId(id);
    setQ(cat.query);       // set underlying operator query
    setUiSource('');       // optional: clear UI dropdown to let query drive
    load(1, { commit: false, pushHistory: true });
  }
  function clearCategory() {
    setCatId('');
    // reset to default (no q) — shows latest feed or whatever your default path is
    setQ('');
    load(1, { commit: false, pushHistory: true });
  }

  // Export/Import recents
  function exportJSON() {
    const json = JSON.stringify(recents, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'trenderai-searches.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function importJSON(mode: 'merge' | 'replace') {
    fileInputRef.current?.setAttribute('data-mode', mode);
    fileInputRef.current?.click();
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const mode = (e.currentTarget.getAttribute('data-mode') as 'merge'|'replace') || 'merge';
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      try {
        const importedRecents = JSON.parse(text);
        setRecents(importedRecents);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (e) {
        setError('Failed to import recents: Invalid JSON file.');
        try { const Sentry = require('@sentry/nextjs'); Sentry.captureException?.(e); } catch {}
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-screen" style={{ background:'#000', color:'#fff' }}>
      <div className="mx-auto max-w-6xl p-6">
        <Toast message={error} onClose={()=>setError('')} />
        <div className="flex items-center justify-between">
          <Logo size="lg" />
        </div>

        {/* CATEGORY BAR */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={clearCategory}
            className={catId ? "px-3 py-1 rounded-full text-sm" : "px-3 py-1 rounded-full text-sm btn-accent"}
            style={catId ? { background:'#111', color:'#fff', border:'1px solid #222' } : {}}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={()=>applyCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-sm inline-flex items-center gap-2 ${catId === cat.id ? 'btn-accent' : ''}`}
              style={catId !== cat.id ? { background:'#111', color:'#fff', border:'1px solid #222' } : {}}
              title={cat.label}
            >
              <span>{cat.emoji ?? '•'}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Search controls (optional refinement) */}
        <div className="mt-4">
          <div className="relative">
            <div className="flex flex-wrap gap-3 items-center">
              <input
                ref={inputRef}
                value={q}
                onChange={(e)=>{ setQ(e.target.value); setCatId(''); }} // typing clears category
                onKeyDown={onKeyDown}
                placeholder={catId ? `Refine ${getCategory(catId)?.label}…` : 'Search (e.g., ai agents OR robotics -crypto, tag:crypto since:7d sort:score)…'}
                className="px-3 py-2 rounded-xl text-black flex-1 min-w-[260px]"
              />
              <select
                value={uiSource}
                onChange={(e)=>{ setUiSource(e.target.value); setCatId(''); }}
                className="px-3 py-2 rounded-xl text-black"
                title="Filter by Source"
              >
                <option value="">All sources</option>
                <option value="reddit">Reddit</option>
                <option value="youtube">YouTube</option>
                <option value="newsapi">News</option>
                <option value="coingecko">CoinGecko</option>
                <option value="alphavantage">Alpha Vantage</option>
                <option value="google_trends">Google Trends</option>
              </select>
              <button onClick={commitSearch} className="btn-accent">
                {loading ? 'Loading…' : 'Search'}
              </button>
              <button onClick={async ()=>{ try {
                const url = buildUrl(q, uiSource, catId).toString();
                await navigator.clipboard.writeText(url);
                setCopied(true); setTimeout(()=>setCopied(false),1200);
              } catch {} }} className="px-3 py-2 rounded-xl font-medium"
                style={{ background:'#111', color:'var(--accent)', border:'1px solid #222' }}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <SearchSuggest input={q} anchorRef={inputRef} onApply={(next)=> { setQ(next); setCatId(''); }} />
          </div>
        </div>

        {/* Operator chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {tokens.map((t, idx) => {
            const labelMap: Record<string, string> = {
              tag: 'tag', source: 'source', region: 'region',
              since: 'since', until: 'until', before: 'before',
              sort: 'sort', score: 'score', delta24h: 'delta24h'
            };
            const label = `${labelMap[t.key] ?? t.key}:${t.value}`;
            return <Chip key={`${t.start}-${t.end}-${idx}`} label={label} onRemove={()=>removeToken(t)} />;
          })}
          {uiSource && (
            <Chip label={`source:${uiSource} (UI)`} onRemove={()=>setUiSource('')} />
          )}
          {(tokens.length > 0 || uiSource) && (
            <button onClick={clearAllTokens} className="underline text-sm" style={{ color:'var(--accent)' }}>
              Clear all
            </button>
          )}
        </div>

        {/* Recent searches + Import/Export */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm uppercase tracking-wide" style={{ color:'var(--accent)' }}>Recent searches</h2>
            <div className="flex gap-3">
              <button onClick={exportJSON} className="text-sm underline" style={{ color:'var(--accent)' }}>Export</button>
              <button onClick={()=>{ fileInputRef.current?.setAttribute('data-mode','merge'); fileInputRef.current?.click(); }} className="text-sm underline" style={{ color:'var(--accent)' }}>Import (merge)</button>
              <button onClick={()=>{ fileInputRef.current?.setAttribute('data-mode','replace'); fileInputRef.current?.click(); }} className="text-sm underline" style={{ color:'var(--accent)' }}>Import (replace)</button>
              {recents.length > 0 && (
                <button onClick={() => { if (confirm('Clear all recent searches?')) { clearRecents(); setRecents([]); } }} className="text-sm underline" style={{ color:'var(--accent)' }}>
                  Clear history
                </button>
              )}
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={(e)=>{
            const file = e.target.files?.[0]; if (!file) return;
            const mode = (e.currentTarget.getAttribute('data-mode') as 'merge'|'replace') || 'merge';
            const reader = new FileReader();
            reader.onload = () => {
              const text = String(reader.result || '');
              try {
                const importedRecents = JSON.parse(text);
                setRecents(importedRecents);
                if (fileInputRef.current) fileInputRef.current.value = '';
              } catch (e) {
                setError('Failed to import recents: Invalid JSON file.');
                try { const Sentry = require('@sentry/nextjs'); Sentry.captureException?.(e); } catch {}
              }
            };
            reader.readAsText(file);
          }} className="hidden" />
          {recents.length === 0 ? (
            <div className="text-sm opacity-70">Your recent searches will appear here.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recents.map(r => (
                <RecentChip
                  key={r.id}
                  r={r}
                  onRun={(qq)=>{ setCatId(''); runRecent(qq); }}
                  onPin={(id)=> setRecents(togglePin(id))}
                  onRemove={(id)=> setRecents(removeRecent(id))}
                />
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          {loading && items.length === 0 && Array.from({length:6}).map((_,i)=><SkeletonCard key={i} />)}
                          {items.map(it=>{
                  const { term, geo } = deriveTermAndGeo(it.topic, it.region);
                  return (
                    <div key={it.id ?? it.topic + String(it.observedAt)} className="rounded-2xl p-4" style={{ background:'#111', border:'1px solid #222' }}>
                      {it.imageUrl && (
                        <CardImage remoteUrl={String(it.imageUrl)} alt={String(it.topic)} ratio="16/9" widthHint={520} />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide" style={{ color:'var(--accent)' }}>{it.source}</span>
                        <span className="text-sm">Score: {Math.round(it.score)}</span>
                      </div>
                <div className="mt-2 text-lg font-medium">{it.topic}</div>
                <div className="mt-1 text-sm opacity-80">Observed: {new Date(it.observedAt).toLocaleString()}</div>
                {it.delta24h!=null && <div className="mt-1 text-sm">Δ24h: {Number(it.delta24h).toFixed(2)}%</div>}
                {it.source === 'google_trends' && (
                  <div className="mt-2">
                    <TrendSparkline term={term} geo={geo} width={160} height={36} />
                  </div>
                )}
                                      <div className="mt-3 flex flex-wrap gap-2">
                        {asTagArray((it as any).tags).slice(0,5).map(tag=>(
                          <span key={tag} className="text-xs px-2 py-1 rounded-full" style={{ background:'#222' }}>#{tag}</span>
                        ))}
                      </div>
                      <div className="mt-3">
                        <ShareButtons 
                          title={it.topic} 
                          url={it.url} 
                          source={it.source} 
                          tags={asTagArray((it as any).tags)}
                        />
                      </div>
                      {it.url && <a href={it.url} target="_blank" className="mt-3 inline-block underline" style={{ color:'var(--accent)' }}>Open</a>}
              </div>
            );
          })}
        </div>

        {/* Load more */}
        {items.length < total && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={()=>load(page+1, { append:true, pushHistory:true })}
              className="btn-accent"
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
