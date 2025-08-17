import crypto from 'crypto';
export function makeHash(parts: (string | undefined | null)[]) {
  const base = parts.filter(Boolean).join('||').slice(0, 5000);
  return crypto.createHash('sha256').update(base).digest('hex');
}

