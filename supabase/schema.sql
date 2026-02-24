-- Run this in: Supabase Dashboard → SQL Editor

create table scripts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default 'Untitled',
  code         text not null default '',
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  published_at timestamptz
);

-- Index to speed up lookups on the public endpoint /p/:id.js
create index scripts_status_idx on scripts (id, status);