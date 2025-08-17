create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  url text,
  title text,
  text text,
  author text,
  lang text default 'en',
  published_at timestamptz,
  tags jsonb default '[]'::jsonb,
  metrics jsonb default '{}'::jsonb,
  raw jsonb default '{}'::jsonb,
  hash char(64) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists items_source_sourceid_uidx on items(source, source_id);
create unique index if not exists items_hash_uidx on items(hash);

-- optional materialized view hooks can be added later for trend deltas

