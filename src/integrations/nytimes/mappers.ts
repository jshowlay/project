import { idFrom } from '../../lib/hash.js';

export type NormalizedItem = {
  id: string;
  source: 'nytimes';
  channel: 'timeswire'|'topstories'|'mostpopular'|'articlesearch'|'archive';
  url: string;
  title?: string;
  abstract?: string;
  byline?: string;
  section?: string;
  subsection?: string;
  published_at?: string;
  updated_at?: string;
  tags?: string[];
  entities?: Record<string, string[]>;
  media?: any[];
  popularity?: any;
  editorial?: boolean;
  raw: any;
};

const uniq = (a: any[]) => Array.from(new Set(a.filter(Boolean)));

function collectTags(x: any) {
  // NYT often emits *_facet arrays
  const des = x.des_facet || x.des_facet?.values || [];
  const org = x.org_facet || [];
  const per = x.per_facet || [];
  const geo = x.geo_facet || [];
  return uniq([...(des||[]), ...(org||[]), ...(per||[]), ...(geo||[])]);
}

export function mapTimesWire(r: any): NormalizedItem[] {
  const items = r?.results || [];
  return items.map((x: any) => {
    const url = x.url || x?.link || x?.web_url;
    const id = idFrom(['nytimes','timeswire', url, x.published_date]);
    
    // Skip media field for now due to JSON parsing issues
    const media = null;
    
    return {
      id,
      source: 'nytimes',
      channel: 'timeswire',
      url,
      title: x.title,
      abstract: x.abstract,
      byline: x.byline,
      section: x.section,
      subsection: x.subsection,
      published_at: x.published_date,
      updated_at: x.updated_date,
      tags: collectTags(x),
      entities: { per: x.per_facet || [], org: x.org_facet || [], geo: x.geo_facet || [], des: x.des_facet || [] },
      media,
      raw: x
    };
  });
}

export function mapTopStories(r: any, section: string): NormalizedItem[] {
  const items = r?.results || [];
  return items.map((x: any) => {
    const url = x.url;
    const id = idFrom(['nytimes','topstories', url, x.published_date]);
    
    // Skip media field for now due to JSON parsing issues
    const media = null;
    
    return {
      id,
      source: 'nytimes',
      channel: 'topstories',
      url,
      title: x.title,
      abstract: x.abstract,
      byline: x.byline,
      section: x.section || section,
      subsection: x.subsection,
      published_at: x.published_date,
      updated_at: x.updated_date,
      tags: collectTags(x),
      entities: { per: x.per_facet || [], org: x.org_facet || [], geo: x.geo_facet || [], des: x.des_facet || [] },
      media,
      editorial: true,
      raw: x
    };
  });
}

export function mapMostPopular(r: any, list: 'viewed'|'shared'|'emailed', period: number): NormalizedItem[] {
  const items = r?.results || [];
  return items.map((x: any) => {
    const url = x.url;
    const id = idFrom(['nytimes','mostpopular', list, period, url, x.published_date]);
    
    // Skip media field for now due to JSON parsing issues
    const media = null;
    
    return {
      id,
      source: 'nytimes',
      channel: 'mostpopular',
      url,
      title: x.title || x?.media?.[0]?.caption,
      abstract: x.abstract,
      byline: x.byline,
      section: x.section,
      subsection: x.subsection,
      published_at: x.published_date,
      tags: collectTags(x),
      entities: { per: x.per_facet || [], org: x.org_facet || [], geo: x.geo_facet || [], des: x.des_facet || [] },
      media,
      popularity: { list, period },
      raw: x
    };
  });
}

export function mapArticleSearch(r: any): NormalizedItem[] {
  const docs = r?.response?.docs || [];
  return docs.map((d: any) => {
    const url = d.web_url;
    const id = idFrom(['nytimes','articlesearch', url, d.pub_date]);
    const tags = uniq([...(d.keywords?.map((k:any)=>k.value) || []), ...(d.des_facet||[]), ...(d.per_facet||[])]);
    return {
      id,
      source: 'nytimes',
      channel: 'articlesearch',
      url,
      title: d.headline?.main,
      abstract: d.abstract || d.snippet,
      byline: d.byline?.original,
      section: d.section_name || d.news_desk,
      published_at: d.pub_date,
      updated_at: d.updated || d._updated || undefined,
      tags,
      entities: undefined,
      media: null,
      raw: d
    };
  });
}

// Archive uses same fields as Article Search payload
export const mapArchive = (r: any) => mapArticleSearch({ response: { docs: r?.response?.docs || r?.response?.docs || r?.results || r?.response?.docs } });
