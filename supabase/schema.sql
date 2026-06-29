-- Future Supabase foundation only. The current demos still use localStorage
-- and do not read from or write to this table.

create extension if not exists pgcrypto;

create table if not exists public.demo_records (
  id uuid primary key default gen_random_uuid(),
  demo_type text not null,
  title text not null,
  status text not null,
  source text,
  raw_input text,
  internal_notes text,
  analysis jsonb,
  analysis_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.demo_records is
  'Future shared storage for workflow demos. This table is not wired into the app yet.';

comment on column public.demo_records.demo_type is
  'Workflow identifier such as lead_follow_up, recruitment, or document_intake.';

comment on column public.demo_records.analysis is
  'Structured AI result stored as JSONB for later human review.';

-- Keep browser access closed until authentication and explicit policies are
-- designed in a later phase.
alter table public.demo_records enable row level security;

create table if not exists public.demo_record_events (
  id uuid primary key default gen_random_uuid(),
  demo_record_id uuid,
  demo_type text not null,
  action text not null,
  title text,
  details jsonb,
  created_at timestamptz not null default now()
);

comment on table public.demo_record_events is
  'Internal activity log for demo record updates and deletes. Written through server-side API helpers only.';

comment on column public.demo_record_events.demo_record_id is
  'The related demo_records id when available. Kept nullable so deleted-record events can preserve the old id.';

comment on column public.demo_record_events.details is
  'JSON details for the internal record change, such as updated fields or deleted record metadata.';

-- Keep browser access closed until authentication and explicit policies are
-- designed in a later phase. Server-side admin API routes can still write.
alter table public.demo_record_events enable row level security;
