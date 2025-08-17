export function toIso(d?: string | number | Date | null) {
  if (!d) return null;
  try { return new Date(d).toISOString(); } catch { return null; }
}

