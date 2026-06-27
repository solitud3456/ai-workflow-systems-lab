# Decisions

## Project positioning

This project is an AI workflow systems portfolio lab, not a fake agency.

## First demo

The first demo will be Lead Follow-up Assistant.

Reason:

It is easy to understand, applies to many businesses, and connects directly to revenue.

## AI approach

Start with manual AI mode because there is no API budget.

Do not add paid API integration yet.

## Tech approach

Start simple:

- Next.js
- TypeScript
- Tailwind
- local state
- LocalStorage later
- Supabase later

## Current decisions — 2026-06-24

### Positioning

AI Workflow Systems Lab is a portfolio lab for proving practical workflow
skills. It is not an agency, and project language should avoid fake client
claims, exaggerated outcomes, or unsupported marketing.

### Current AI approach

Manual-AI workflows remain the current focus. The demos generate structured
prompts, accept strict JSON pasted back from an AI tool, and require human
review before the output is used. Paid or automated API integration is a
future upgrade.

### Current demos

- Lead Follow-up Assistant
- Recruitment Workflow Assistant
- Document Intake Assistant

### Shared demo pattern

All demos intentionally use:

- localStorage-first persistence
- manual prompt generation
- strict JSON paste-back
- human review and approval before action
- copyable final output
- dashboard metrics
- delete and reset controls

### Deferred scope

Supabase, database storage, authentication, and live AI API mode are not part
of the current prototype scope. They should be added as deliberate upgrades,
with human-review safeguards preserved.

### Next development priority

Pause additional demo development until shared components, storage logic, and
the reusable demo architecture have been cleaned up.

## Decision: Lead Supabase sync uses internal API route

- Direct browser Supabase writes were intentionally avoided because Row Level Security blocked public writes.
- The Lead Follow-up demo now syncs through `/api/lead-records`.
- The API route uses a server-only Supabase admin client with `SUPABASE_SERVICE_ROLE_KEY`.
- The service role key is stored only in local `.env.local` and Vercel environment variables.
- The service role key is not exposed to client-side code and is not committed to Git.
- localStorage remains the main working storage and fallback behavior.
- Recruitment and Document Intake demos are not wired to Supabase yet.
- This keeps the project safer than opening public insert/update policies too early.
