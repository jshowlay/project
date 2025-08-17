"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import TrendCard from "./TrendCard";

type TrendRow = any;

export default function TrendFeed() {
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowSel, setWindowSel] = useState<"1h"|"24h">("1h");
  const [sourceSel, setSourceSel] = useState<string>(""); // comma-separated
  const [regionSel, setRegionSel] = useState<string>(process.env.NEXT_PUBLIC_DEFAULT_REGION || "");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("window", windowSel);
    if (sourceSel) params.set("sources", sourceSel);
    if (regionSel) params.set("region", regionSel);
    params.set("limit", "60");
    
    const res = await fetch(`/api/signals/trending?${params.toString()}`, { cache: "no-store" });
    const json = await res.json();
    setRows(json.rows || []);
    setLoading(false);
  }, [windowSel, sourceSel, regionSel]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select 
          value={windowSel} 
          onChange={e=>setWindowSel(e.target.value as any)} 
          className="px-3 py-2 rounded-md bg-white/10"
        >
          <option value="1h">Last hour</option>
          <option value="24h">Last 24h</option>
        </select>
        <input 
          placeholder="Filter sources (comma, e.g. wikipedia,hackernews)"
          value={sourceSel} 
          onChange={e=>setSourceSel(e.target.value)}
          className="px-3 py-2 rounded-md bg-white/10 w-[360px]" 
        />
        <input 
          placeholder="Region (optional)" 
          value={regionSel} 
          onChange={e=>setRegionSel(e.target.value)}
          className="px-3 py-2 rounded-md bg-white/10 w-[160px]" 
        />
        <button 
          onClick={load} 
          className="px-3 py-2 rounded-md bg-amber-600 hover:bg-amber-700"
        >
          Refresh
        </button>
      </div>
      
      {loading ? <div className="opacity-60">Loading…</div> : null}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r: any) => (
          <TrendCard key={`${r.source}-${r.entity_id}-${r.metric}`} row={r} />
        ))}
      </div>
      
      {!loading && rows.length === 0 ? (
        <div className="opacity-60">No signals yet — ingestion will populate shortly.</div>
      ) : null}
    </div>
  );
}
