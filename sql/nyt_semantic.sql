-- Cache for TimesTags/Semantic lookups to avoid rate limits & repeats
create table if not exists nyt_concept_cache (
  q text primary key,         -- raw query term
  results jsonb not null,     -- API response (normalized list)
  updated_at timestamptz default now()
);

create index if not exists idx_content_items_entities on content_items using gin (entities);
