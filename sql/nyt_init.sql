-- Normalized news table shared across sources
create table if not exists content_items (
  id text primary key,                -- sha256 hash (stable unique ID)
  source text not null,               -- e.g. 'nytimes'
  channel text not null,              -- 'timeswire' | 'topstories' | 'mostpopular' | 'articlesearch' | 'archive'
  url text not null,
  title text,
  abstract text,
  byline text,
  section text,
  subsection text,
  published_at timestamptz,
  updated_at timestamptz,
  tags text[],
  entities jsonb,                     -- { per:[], org:[], geo:[], des:[] }
  media jsonb,                        -- passthrough NYT multimedia arrays
  popularity jsonb,                   -- e.g. { list:"viewed", period:7 }
  editorial boolean default false,    -- Top Stories signal
  raw jsonb not null,                 -- full API payload object
  created_at timestamptz default now()
);

create index if not exists idx_content_items_source_published on content_items(source, published_at desc);
create index if not exists idx_content_items_section on content_items(section);
create index if not exists idx_content_items_url on content_items(url);
