'use client';
import { useDensity } from './DensityProvider';

export default function DensityToggle() {
  const { density, setDensity, toggle } = useDensity();

  const baseBtn: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 10,
    border: '1px solid #222',
    background: '#111',
    color: '#fff',
    fontSize: 12,
    lineHeight: '16px',
    cursor: 'pointer'
  };

  const active: React.CSSProperties = {
    background: 'var(--accent)',
    color: '#000',
    border: '1px solid var(--accent)'
  };

  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label="Density">
      <button
        onClick={() => setDensity('comfortable')}
        title="Comfortable"
        style={{ ...baseBtn, ...(density === 'comfortable' ? active : {}) }}
      >
        Comfortable
      </button>
      <button
        onClick={() => setDensity('compact')}
        title="Compact"
        style={{ ...baseBtn, ...(density === 'compact' ? active : {}) }}
      >
        Compact
      </button>
      <button
        onClick={() => setDensity('ultra')}
        title="Ultra-Compact"
        style={{ ...baseBtn, ...(density === 'ultra' ? active : {}) }}
      >
        Ultra
      </button>
    </div>
  );
}
