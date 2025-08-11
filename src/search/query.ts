export type SortMode = 'rank' | 'score' | 'recency';

export type ParsedQuery = {
  text: string;            // remaining free-text for FTS
  tags: string[];          // tag:ai tag:"gen ai"
  sources: string[];       // source:reddit source:youtube ...
  region?: string;         // region:US (ISO-ish)
  since?: Date;            // since:2025-08-01 or since:7d / 24h / 2w / 3m
  until?: Date;            // until:... / before:...
  minScore?: number;       // score:>50 / score:>=50
  maxScore?: number;       // score:<80 / score:<=80
  minDelta24h?: number;    // delta24h:>5 or <-3
  maxDelta24h?: number;
  sort: SortMode;          // sort:rank|score|recency (default rank if text present, else recency)
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

export function parseQuery(input: string): ParsedQuery {
  let text = input.trim();
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

  const re = /\b(tag|source|region|since|until|before|sort|score|delta24h):("([^"]+)"|[^\s"]+)/gi;
  let match: RegExpExecArray | null;

  const consumed: { start: number; end: number }[] = [];

  while ((match = re.exec(input)) !== null) {
    const key = match[1].toLowerCase();
    const rawVal = (match[3] ?? match[2]).trim();
    consumed.push({ start: match.index, end: match.index + match[0].length });

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

  // Remove consumed segments from text (preserve spacing)
  if (consumed.length) {
    const spans = consumed.sort((a,b)=>a.start-b.start);
    let i = 0; let out = '';
    for (const s of spans) {
      out += input.slice(i, s.start);
      i = s.end;
    }
    out += input.slice(i);
    text = out.replace(/\s+/g, ' ').trim();
  }

  // Default sort: if we have text, prefer rank; otherwise recency
  const finalSort: SortMode = sort ?? (text ? 'rank' : 'recency');

  return { text, tags, sources, region, since, until, minScore, maxScore, minDelta24h, maxDelta24h, sort: finalSort };
}
