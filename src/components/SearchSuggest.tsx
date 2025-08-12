'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type SourceResp = { active: string[]; all: string[] };
type TagResp = { tags: { tag: string; count: number }[] };
type RegionResp = { regions: string[] };

type SuggestItem = { label: string; value: string; hint?: string };

function useActiveSources() {
  const [sources, setSources] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/sources', { cache: 'no-store' })
      .then(r => r.json()).then((d: SourceResp) => setSources(d.active ?? []))
      .catch(() => {});
  }, []);
  return sources;
}

async function fetchTags(q: string): Promise<SuggestItem[]> {
  try {
    const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    const data = await res.json() as TagResp;
    return (data.tags ?? []).slice(0, 10).map(t => ({
      label: `tag:${t.tag}`, value: `tag:${t.tag}`, hint: `${t.count}`
    }));
  } catch { return []; }
}

async function fetchRegions(q: string): Promise<SuggestItem[]> {
  try {
    const res = await fetch(`/api/regions?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    const data = await res.json() as RegionResp;
    const items = (data.regions ?? []).slice(0, 10);
    return items.map(r => ({ label: `region:${r}`, value: `region:${r}` }));
  } catch { return []; }
}

function staticOperatorStubs(prefix: string): SuggestItem[] {
  const ops = ['tag:', 'source:', 'since:', 'until:', 'sort:', 'score:', 'delta24h:', 'region:'];
  return ops
    .filter(op => op.toLowerCase().startsWith(prefix.toLowerCase()))
    .map(op => ({ label: op, value: op }));
}

function staticSortSuggestions(): SuggestItem[] {
  return ['rank', 'score', 'recency'].map(s => ({ label: `sort:${s}`, value: `sort:${s}` }));
}

function staticSinceUntilSuggestions(): SuggestItem[] {
  const today = new Date().toISOString().slice(0,10);
  return ['24h','48h','7d','2w','1m','3m', today].map(v => ({ label: v, value: v }));
}

function staticScoreDeltaSuggestions(kind: 'score'|'delta24h', typed: string): SuggestItem[] {
  const presets = ['>80','>70','>60','>50','>40','>20','<20','<10','>0','<-5'];
  const filtered = typed ? presets.filter(p => p.startsWith(typed)) : presets;
  return filtered.map(p => ({ label: `${kind}:${p}`, value: `${kind}:${p}` }));
}

export type SearchSuggestProps = {
  input: string;                       // full current input (q)
  onApply: (nextInput: string) => void; // replace the last token with selection
  anchorRef: React.RefObject<HTMLInputElement>;
};

export default function SearchSuggest({ input, onApply, anchorRef }: SearchSuggestProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const sources = useActiveSources();
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine the "current token" (last space-delimited segment)
  const { lastToken, base, op, val } = useMemo(() => {
    const trimmed = input.replace(/\s+$/,'');
    const parts = trimmed.split(/\s+/);
    const last = parts[parts.length - 1] ?? '';
    const colonIdx = last.indexOf(':');
    const op = colonIdx > -1 ? last.slice(0, colonIdx).toLowerCase() : '';
    const val = colonIdx > -1 ? last.slice(colonIdx + 1) : '';
    const base = parts.slice(0, -1).join(' ');
    return { lastToken: last, base, op, val };
  }, [input]);

  // Build suggestions for the current context
  useEffect(() => {
    let cancelled = false;
    async function build() {
      // If nothing typed yet → suggest operators
      if (!lastToken) {
        const stubs = staticOperatorStubs('');
        setItems(stubs);
        setActiveIdx(0);
        setOpen(true);
        return;
      }
      // If still typing the operator stub
      if (!lastToken.includes(':')) {
        const stubs = staticOperatorStubs(lastToken);
        setItems(stubs);
        setActiveIdx(0);
        setOpen(stubs.length > 0);
        return;
      }
      // Operator-specific suggestions
      if (op === 'source') {
        const vals = sources.map(s => ({ label: `source:${s}`, value: `source:${s}` }))
          .filter(x => !val || x.value.toLowerCase().includes(val.toLowerCase()));
        setItems(vals);
        setActiveIdx(0);
        setOpen(vals.length > 0);
        return;
      }
      if (op === 'tag') {
        const vals = await fetchTags(val);
        if (!cancelled) {
          setItems(vals);
          setActiveIdx(0);
          setOpen(vals.length > 0);
        }
        return;
      }
      if (op === 'region') {
        const vals = await fetchRegions(val);
        if (!cancelled) {
          setItems(vals);
          setActiveIdx(0);
          setOpen(vals.length > 0);
        }
        return;
      }
      if (op === 'sort') {
        const vals = staticSortSuggestions().filter(x => !val || x.value.endsWith(val.toLowerCase()));
        setItems(vals);
        setActiveIdx(0);
        setOpen(vals.length > 0);
        return;
      }
      if (op === 'since' || op === 'until' || op === 'before') {
        const vals = staticSinceUntilSuggestions().filter(x => !val || x.value.startsWith(val));
        setItems(vals.map(v => ({ label: `${op}:${v.value}`, value: `${op}:${v.value}` })));
        setActiveIdx(0);
        setOpen(vals.length > 0);
        return;
      }
      if (op === 'score' || op === 'delta24h') {
        const vals = staticScoreDeltaSuggestions(op, val);
        setItems(vals);
        setActiveIdx(0);
        setOpen(vals.length > 0);
        return;
      }
      // Default: no suggestions
      setItems([]);
      setOpen(false);
    }
    build();
    return () => { cancelled = true; };
  }, [lastToken, op, val, sources]);

  // Positioning under the anchor input
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    const left = rect.left + window.scrollX;
    const width = rect.width;
    setDropdownStyle({ position: 'absolute', top, left, width, zIndex: 50 });
    function onResize(){ 
      if (!el) return;
      const r = el.getBoundingClientRect();
      setDropdownStyle({ position: 'absolute', top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width, zIndex: 50 });
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => { window.removeEventListener('resize', onResize); window.removeEventListener('scroll', onResize, true); };
  }, [anchorRef]);

  function apply(item: SuggestItem) {
    const next = base ? `${base} ${item.value}` : item.value;
    onApply(next.trim() + ' ');
    setOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!open || items.length === 0) return null;

  return (
    <div ref={containerRef} style={dropdownStyle}>
      <div className="rounded-xl shadow-xl overflow-hidden" style={{ background:'#0f0f0f', border:'1px solid #222' }}>
        {items.map((it, i) => (
          <button
            key={it.label + i}
            onMouseDown={(e)=>{ e.preventDefault(); apply(it); }}
            onMouseEnter={()=>setActiveIdx(i)}
            className="w-full text-left px-3 py-2"
            style={{
              background: i===activeIdx ? '#1a1a1a' : 'transparent',
              color: '#fff',
              borderBottom: i === items.length - 1 ? 'none' : '1px solid #111'
            }}
          >
            <div className="flex items-center justify-between">
              <span>
                <span style={{ color:'var(--accent)' }}>{it.label.split(':')[0]}:</span>
                <span> {it.label.split(':').slice(1).join(':')}</span>
              </span>
              {it.hint && <span className="text-xs opacity-70">{it.hint}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
