import 'dotenv/config';

const BASE = 'https://api.nytimes.com';

function buildURL(path: string, params: Record<string, any> = {}) {
  const u = new URL(path, BASE);
  u.searchParams.set('api-key', process.env.NYT_API_KEY!);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function get<T = any>(path: string, params?: Record<string, any>): Promise<T> {
  const url = buildURL(path, params);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    if (res.status === 429) {
      console.warn('Rate limit hit, waiting 60 seconds...');
      await new Promise(resolve => setTimeout(resolve, 60000));
      return get(path, params); // retry
    }
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export const TimesWire = {
  // source: all|nyt|inyt, section: e.g. 'all','technology','business'; time-period limits by hours
  list: (source='all', section='all', opts: { limit?: number; offset?: number; ['time-period']?: number } = {}) =>
    get(`/svc/news/v3/content/${source}/${section}.json`, opts),
};

export const TopStories = {
  section: (section='home') => get(`/svc/topstories/v2/${section}.json`)
};

export const MostPopular = {
  viewed: (period=1) => get(`/svc/mostpopular/v2/viewed/${period}.json`),
  shared: (period=1) => get(`/svc/mostpopular/v2/shared/${period}.json`),
  emailed: (period=1) => get(`/svc/mostpopular/v2/emailed/${period}.json`)
};

export const ArticleSearch = {
  search: (params: {
    q?: string; fq?: string; page?: number; sort?: 'newest'|'oldest'|'relevance';
    begin_date?: string; end_date?: string;
  }) => get(`/svc/search/v2/articlesearch.json`, params)
};

export const Archive = {
  month: (year: number, month: number) => get(`/svc/archive/v1/${year}/${month}.json`)
};
