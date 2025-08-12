'use client';
import { useEffect, useRef, useState } from 'react';
import Sparkline from './Sparkline';

type Props = {
  term: string;
  geo?: string;
  date?: string;   // e.g., 'today 12-m'
  width?: number;
  height?: number;
};

export default function TrendSparkline({ term, geo='US', date='today 12-m', width=160, height=36 }: Props) {
  const [data, setData] = useState<number[] | null>(null);
  const [err, setErr] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setData(null); setErr('');
    if (!term) return;
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;

    const url = new URL('/api/trends/sparkline', window.location.origin);
    url.searchParams.set('term', term);
    url.searchParams.set('geo', geo);
    url.searchParams.set('date', date);

    fetch(url.toString(), { signal: ctl.signal })
      .then(r => r.json())
      .then(j => {
        if (!j?.ok) throw new Error(j?.error || 'failed');
        const pts: Array<{t:string; v:number}> = j.points || [];
        setData(pts.map(p => Number(p.v) || 0));
      })
      .catch(e => { if (!(e instanceof DOMException)) setErr(String(e?.message ?? e)); });

    return () => ctl.abort();
  }, [term, geo, date]);

  if (err) return <div className="text-xs opacity-60">no sparkline</div>;
  if (!data) return (
    <div style={{ width, height }} className="animate-pulse rounded" />
  );
  if (data.length === 0) return <div className="text-xs opacity-60">no data</div>;

  return <Sparkline data={data} width={width} height={height} />;
}
