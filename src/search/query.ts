export type SortMode = 'rank' | 'score' | 'recency';

export type ParsedQuery = {
  text: string;
  tags: string[];
  sources: string[];
  region?: string;
  since?: Date;
  until?: Date;
  minScore?: number;
  maxScore?: number;
  minDelta24h?: number;
  maxDelta24h?: number;
  sort: SortMode;
};

export type TokenKind = 'tag'|'source'|'region'|'since'|'until'|'before'|'sort'|'score'|'delta24h';
export type QueryToken = {
  key: TokenKind;
  value: string;      // normalized value
  raw: string;        // e.g., source:reddit or tag:"gen ai"
  start: number;      // start index in original string
  end: number;        // end index (exclusive)
};

function parseNumberOp(token: string): {op: '>'|'>='|'<'|'<='; value: number} | null {
  const m = token.match(/^([<>]=?)(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return { op: m[1] as any, value: Number(m[2]) };
}

function parseDurationOrDate(v: string): Date | undefined {
  // ISO date?
  const iso = new Date(v);
  if (!isNaN(iso.getTime())) return iso;
  // Relative like 7d, 24h, 2w, 3m (m = 30 days)
  const m = v.match(/^(\d+)([hdwm])$/i);
  if (!m) return undefined;
  const n = Number(m[1]); const u = m[2].toLowerCase();
  const now = new Date();
  const ms =
    u === 'h' ? n*60*60*1000 :
    u === 'd' ? n*24*60*60*1000 :
    u === 'w' ? n*7*24*60*60*1000 :
    /* m */    n*30*24*60*60*1000;
  return new Date(now.getTime() - ms);
}

// NEW: returns both structured query + token spans for UI chips
export function parseQueryDetailed(input: string): { parsed: ParsedQuery; tokens: QueryToken[] } {
  let text = input;
  const tags: string[] = [];
  const sources: string[] = [];
  let region: string | undefined;
  let since: Date | undefined;
  let until: Date | undefined;
  let minScore: number | undefined;
  let maxScore: number | undefined;
  let minDelta24h: number | undefined;
  let maxDelta24h: number | undefined;
  let sort: SortMode | undefined;
  const tokens: QueryToken[] = [];

  const re = /\b(tag|source|region|since|until|before|sort|score|delta24h):("([^"]+)"|[^\s"]+)/gi;
  let match: RegExpExecArray | null;

  const consumed: { start: number; end: number }[] = [];

  while ((match = re.exec(input)) !== null) {
    const key = match[1].toLowerCase() as TokenKind;
    const rawWhole = match[0];
    const rawVal = (match[3] ?? match[2]).trim();
    const start = match.index;
    const end = match.index + rawWhole.length;
    consumed.push({ start, end });
    tokens.push({ key, value: rawVal, raw: rawWhole, start, end });

    switch (key) {
      case 'tag': tags.push(rawVal); break;
      case 'source': sources.push(rawVal.toLowerCase()); break;
      case 'region': region = rawVal.toUpperCase(); break;
      case 'since': {
        const d = parseDurationOrDate(rawVal);
        if (d) since = d;
        break;
      }
      case 'until':
      case 'before': {
        const d = parseDurationOrDate(rawVal);
        if (d) until = d;
        break;
      }
      case 'sort': {
        const v = rawVal.toLowerCase();
        if (v === 'rank' || v === 'score' || v === 'recency') sort = v as SortMode;
        break;
      }
      case 'score': {
        const p = parseNumberOp(rawVal);
        if (p) {
          if (p.op === '>' || p.op === '>=') minScore = p.value;
          else maxScore = p.value;
        }
        break;
      }
      case 'delta24h': {
        const p = parseNumberOp(rawVal);
        if (p) {
          if (p.op === '>' || p.op === '>=') minDelta24h = p.value;
          else maxDelta24h = p.value;
        }
        break;
      }
    }
  }

  // Remove consumed spans from a copy of the input to compute the remaining free-text
  if (consumed.length) {
    const spans = consumed.sort((a,b)=>a.start-b.start);
    let i = 0; let out = '';
    for (const s of spans) { out += input.slice(i, s.start); i = s.end; }
    out += input.slice(i);
    text = out.replace(/\s+/g, ' ').trim();
  } else {
    text = input.trim();
  }

  const finalSort: SortMode = sort ?? (text ? 'rank' : 'recency');
  return { parsed: { text, tags, sources, region, since, until, minScore, maxScore, minDelta24h, maxDelta24h, sort: finalSort }, tokens };
}

// Backwards-compatible helper used by the API
export function parseQuery(input: string): ParsedQuery {
  return parseQueryDetailed(input).parsed;
}
