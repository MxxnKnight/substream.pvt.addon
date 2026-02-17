create table if not exists public.subtitles (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('movie', 'series')),
  imdb_id text,
  tmdb_id bigint,
  season int,
  episode int,
  language text not null,
  hearing_impaired boolean not null default false,
  release_name text,
  file_path text not null,
  uploader_id text,
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_subtitles_lookup
  on public.subtitles (content_type, imdb_id, season, episode, language, status);
