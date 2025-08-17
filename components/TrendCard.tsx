"use client";
import { useEffect, useState } from "react";

type Row = {
  source: string;
  entity_id: string;
  entity_name: string | null;
  metric: string;
  region: string | null;
  now_value: number | null;
  baseline_value: number | null;
  score: number | null;
};

export default function TrendCard({ row }: { row: Row }) {
  const title = row.entity_name || row.entity_id;
  const subtitle = `${row.source} • ${row.metric}${row.region ? " • " + row.region : ""}`;
  
  const pct = row.baseline_value && row.baseline_value !== 0
    ? ((Number(row.now_value||0) - Number(row.baseline_value))/Math.abs(Number(row.baseline_value))) * 100
    : 0;
  
  const isRank = row.metric.startsWith("rank.");
  const delta = isRank ? -pct : pct;
  const deltaText = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs 24h`;

  return (
    <div className="rounded-2xl border border-white/10 p-4 bg-white/5 hover:bg-white/10 transition">
      <div className="text-sm text-white/60">{subtitle}</div>
      <div className="text-lg font-semibold mt-1">{title}</div>
      <div className="mt-2 text-sm">
        <span className={`px-2 py-1 rounded-md ${delta>=0 ? "bg-emerald-600/30" : "bg-rose-600/30"}`}>
          Score {Number(row.score||0).toFixed(2)} • {deltaText}
        </span>
      </div>
    </div>
  );
}
