@AGENTS.md

# AI Workflow Systems Lab Instructions

Read `PROJECT_CONTEXT.md` before making changes. It is the current source of
truth for project state, scope, and priorities.

## Current state

- Live site: https://ai-workflow-systems-lab.vercel.app
- GitHub: https://github.com/solitud3456/ai-workflow-systems-lab
- Live demos:
  - Lead Follow-up Assistant
  - Recruitment Workflow Assistant
  - Document Intake Assistant
- Public pages are complete: homepage, demos, case studies, methods, about,
  and README.

All demos currently use localStorage, manual AI prompts, strict JSON
paste-back, saved analysis, human review, sample JSON helpers, copyable final
outputs, dashboard metrics, and delete/reset controls.

## Shared demo components

When editing the three demo pages, reuse the components in
`src/components/demo`:

- MetricCard
- ReviewStatusBadge
- EmptyState
- DemoPanel
- CopyableOutputBox
- DashboardHeader
- AnalysisReviewCard
- StatusSelect

Keep each demo's record and analysis types, prompts, sample JSON, runtime
validators, and analysis layouts inside its page for now.

`ManualAiPanel` has not been extracted. Do not extract it unless explicitly
requested. Do not create a giant generic `WorkflowDemo` abstraction.

## Project rules

- Preserve the honest portfolio-lab positioning.
- Do not use fake agency language, fake client claims, or exaggerated results.
- Keep manual AI mode as the default.
- Do not add paid or live AI API integration unless explicitly requested.
- Prefer small, focused changes that follow existing project patterns.
- Modify only the files requested by the user.
- Keep TypeScript clean and do not add unnecessary libraries.
- Preserve the existing dark/cyan visual style.
- Keep refactors small and incremental, and test changes across all three
  demos.
- After changing demo components or demo pages, run `npm run lint` and
  `npm run build`.
