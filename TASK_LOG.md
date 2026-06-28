# Task Log

## 2026-06-22

Started AI Workflow Systems Lab.

Created initial documentation:

- PROJECT_CONTEXT.md
- CLAUDE.md
- ROADMAP.md
- TASK_LOG.md
- DECISIONS.md

Current phase:

Phase 0 — Setup

## 2026-06-24

Completed the first three-demo portfolio milestone.

Live demos:

- Lead Follow-up Assistant
- Recruitment Workflow Assistant
- Document Intake Assistant

All three demos now include:

- intake form
- status tracking
- localStorage persistence
- manual AI prompt generation
- copy prompt
- copy sample JSON
- paste JSON result
- save analysis
- human review approval
- copyable output
- dashboard metrics
- delete/reset demo controls

Updated public project pages:

- homepage
- demos
- case studies
- methods
- about
- README

Deployment:

- GitHub repository pushed
- Vercel site deployed: https://ai-workflow-systems-lab.vercel.app

Quality checks:

- `npm run lint` passed
- `npm run build` passed

Current state:

The manual-AI, localStorage portfolio baseline is complete and ready for
future database, authentication, integration, and live AI API upgrades.

## 2026-06-25

Completed the first shared-component cleanup checkpoint.

Extracted reusable demo UI into `src/components/demo`:

- MetricCard
- ReviewStatusBadge
- EmptyState
- DemoPanel
- CopyableOutputBox
- DashboardHeader
- AnalysisReviewCard
- StatusSelect

The Lead Follow-up Assistant, Recruitment Workflow Assistant, and Document
Intake Assistant continue to work after the refactor.

Also fixed the Lead Follow-up localStorage hydration race so saved changes
persist reliably after refresh.

Verification:

- `npm run lint` passed
- `npm run build` passed
- live testing passed after the refactor

`ManualAiPanel` was intentionally not extracted yet because it would touch the
higher-risk prompt, sample JSON, and save-analysis workflow.

## Supabase schema applied

- Created Supabase project.
- Added local `.env.local` with Supabase URL and publishable key.
- Confirmed `.env.local` is ignored by Git.
- Ran `supabase/schema.sql` manually in Supabase SQL Editor.
- Verified `public.demo_records` exists.
- Verified Row Level Security is enabled.
- No demos are wired to Supabase yet; current demos still use localStorage.

## Optional Supabase sync added to Lead demo

- Added optional Supabase sync UI to `/demos/lead-follow-up`.
- Kept localStorage as the main working storage.
- Added save/load controls for development verification.
- Confirmed Supabase write is currently blocked by Row Level Security.
- Confirmed the page handles the RLS error without crashing.
- Recruitment and Document Intake demos were not changed.

## Lead Supabase sync moved behind internal API

- Updated `/demos/lead-follow-up` optional Supabase sync to use `/api/lead-records`.
- Confirmed saving one lead through the internal API route works locally.
- Confirmed loading one lead from Supabase into local demo state works locally.
- Kept localStorage as the main working storage.
- Avoided exposing Supabase service role key in client code.
- Recruitment and Document Intake demos were not changed.

## Vercel Supabase environment configured

- Added Supabase environment variables to Vercel.
- Added `NEXT_PUBLIC_SUPABASE_URL`.
- Added `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Added server-only `SUPABASE_SERVICE_ROLE_KEY`.
- Redeployed the latest production build.
- Confirmed live Lead Follow-up Supabase sync can use the internal API route.

## Lead Supabase sync UX polished

- Polished the optional Supabase sync section on `/demos/lead-follow-up`.
- Clarified that localStorage remains the main demo workspace.
- Clarified that Supabase sync is optional database persistence.
- Added safer load behavior because loading from Supabase replaces local demo state.
- Added validation so obviously invalid lead names are not saved to Supabase.
- Confirmed production `/api/lead-records` returns a clean Lead Follow-up record.

## All demos have optional Supabase sync

- Added optional Supabase sync to Recruitment Workflow Assistant.
- Added optional Supabase sync to Document Intake Assistant.
- Added `/api/recruitment-records` for Recruitment records.
- Added `/api/document-records` for Document Intake records.
- Confirmed Lead, Recruitment, and Document Intake now use internal API routes for Supabase sync.
- Kept localStorage as the main demo workspace for all demos.
- Confirmed live Vercel API routes return Supabase records.
- Created checkpoint tag `v5-all-demos-supabase-sync`.

## Demo records API helper refactor

- Added shared server-side helper utilities for demo record API routes.
- Refactored `/api/lead-records`, `/api/recruitment-records`, and `/api/document-records`.
- Preserved the same API response shape for all three routes.
- Confirmed live Vercel API routes still return Supabase records after the refactor.
- Created checkpoint tag `v6-demo-records-api-refactor`.

## Internal demo records viewer added

- Added `/internal/demo-records`.
- The page loads Lead, Recruitment, and Document Intake records through existing internal API routes.
- Shows grouped records for all three demos.
- Shows key metadata such as title, status, source, approval state, created date, and updated date.
- Includes JSON details for stored raw input and analysis.
- Does not expose Supabase keys.
- Created checkpoint tag `v7-internal-demo-records-viewer`.

## Internal demo record delete actions added

- Added internal delete support for Supabase demo records.
- Added DELETE support to Lead, Recruitment, and Document Intake API routes.
- Delete actions only remove records matching the route's demo type.
- Updated `/internal/demo-records` with per-record delete buttons.
- Added browser confirmation before deleting records.
- Confirmed live Vercel API routes still return clean Supabase records after cleanup.
- Created checkpoint tag `v8-internal-demo-record-delete`.

## Internal tools environment guard added

- Added `INTERNAL_TOOLS_ENABLED` environment guard.
- Protected `/internal/demo-records`.
- Protected `/internal/supabase-status`.
- Internal pages show a disabled message when the flag is not enabled.
- Confirmed internal pages work when `INTERNAL_TOOLS_ENABLED=true`.
- Confirmed disabled state locally when the flag is removed.
- Created checkpoint tag `v9-internal-tools-env-guard`.

## API delete guard added

- Added server-side guard for internal demo record DELETE actions.
- DELETE actions now depend on `INTERNAL_TOOLS_ENABLED=true`.
- GET routes remain available for Lead, Recruitment, and Document Intake records.
- Confirmed live Vercel API routes still return Supabase records.
- Confirmed live DELETE behavior works when internal tools are enabled.
- Created checkpoint tag `v10-api-delete-guard`.
