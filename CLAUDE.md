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

## Project rules

- Preserve the honest portfolio-lab positioning.
- Do not use fake agency language, fake client claims, or exaggerated results.
- Keep manual AI mode as the default.
- Do not add paid or live AI API integration unless explicitly requested.
- Prefer small, focused changes that follow existing project patterns.
- Modify only the files requested by the user.
- Keep TypeScript clean and do not add unnecessary libraries.
- Preserve the existing dark/cyan visual style.
- Before adding a fourth demo, prefer extracting reusable components,
  storage logic, metrics, and manual-AI patterns from the three existing
  demos.
- After code changes, run or recommend `npm run lint` and `npm run build`.
