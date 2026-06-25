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
