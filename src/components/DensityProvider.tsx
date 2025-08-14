'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Density = 'comfortable' | 'compact' | 'ultra';
type Ctx = { density: Density; setDensity: (d: Density) => void; toggle: () => void; };

const DensityContext = createContext<Ctx | null>(null);
const LS_KEY = 'trenderai:density';

function readInitialDensity(): Density {
  try {
    const sp = new URLSearchParams(window.location.search);
    const qp = (sp.get('density') || '').toLowerCase();
    if (qp === 'compact' || qp === 'comfortable' || qp === 'ultra') return qp as Density;
    const ls = (localStorage.getItem(LS_KEY) || '').toLowerCase();
    if (ls === 'compact' || ls === 'comfortable' || ls === 'ultra') return ls as Density;
  } catch {}
  return 'comfortable';
}

function applyDensity(d: Density) {
  try {
    document.documentElement.setAttribute('data-density', d);
    localStorage.setItem(LS_KEY, d);
    window.dispatchEvent(new CustomEvent('density-change', { detail: d }));
  } catch {}
}

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<Density>('comfortable');

  useEffect(() => {
    const init = readInitialDensity();
    setDensityState(init);
    applyDensity(init);
  }, []);

  const setDensity = (d: Density) => { setDensityState(d); applyDensity(d); };
  const toggle = () => {
    setDensity(density === 'comfortable' ? 'compact' : density === 'compact' ? 'ultra' : 'comfortable');
  };

  const value = useMemo(() => ({ density, setDensity, toggle }), [density]);
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>;
}

export function useDensity() {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error('useDensity must be used within DensityProvider');
  return ctx;
}
