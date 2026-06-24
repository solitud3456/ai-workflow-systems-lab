# AI Workflow Systems Lab

A portfolio lab for building practical AI-assisted workflow prototypes.

This project is a beginner-friendly but serious portfolio project focused on learning how AI can fit inside real business workflows. It is not a fake agency and does not claim to have clients. The lab currently has two live demos that show workflow thinking, structured AI outputs, human review, saved state, and clear limitations.

## Links

- Live site: [https://ai-workflow-systems-lab.vercel.app](https://ai-workflow-systems-lab.vercel.app)
- Lead Follow-up Assistant demo: [/demos/lead-follow-up](https://ai-workflow-systems-lab.vercel.app/demos/lead-follow-up)
- Recruitment Workflow Assistant demo: [/demos/recruitment-assistant](https://ai-workflow-systems-lab.vercel.app/demos/recruitment-assistant)
- Case studies: [/case-studies](https://ai-workflow-systems-lab.vercel.app/case-studies)

## Current Live Demos

### Lead Follow-up Assistant

The first working demo shows how a messy customer inquiry can become a structured lead record, an AI-assisted analysis, and a human-reviewed follow-up draft.

It currently demonstrates:

- lead intake
- status tracking
- localStorage persistence
- manual AI prompt generation
- pasted JSON analysis
- human-in-the-loop review
- suggested reply copying
- dashboard metrics
- demo management controls

### Recruitment Workflow Assistant

The second working demo shows how messy candidate notes and application text can become a structured candidate record, an AI-assisted screening summary, and human-reviewed interview preparation.

It currently demonstrates:

- candidate intake
- candidate status tracking
- localStorage persistence
- manual AI screening prompt
- pasted JSON candidate analysis
- human review
- interview question suggestions
- copy interview questions
- dashboard metrics
- demo management controls

## Project Method

This lab uses a workflow-first development method:

- Start with a messy real-world business process.
- Build the workflow before adding paid API integration.
- Use manual AI mode first with structured prompts.
- Ask AI tools for strict JSON outputs.
- Paste AI JSON back into the app and save it.
- Require human review before action.
- Use small persistent prototypes before database or authentication work.
- Turn each demo into portfolio proof with a problem, workflow, limitation, and upgrade path.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- localStorage
- Git/GitHub

## Current Limitations

- localStorage only
- no authentication
- no database yet
- no live AI API integration yet
- manual AI copy/paste workflow

## Planned Upgrades

- Supabase/database storage
- authentication
- real AI API mode
- CRM/email/ATS integrations
- export/reporting
- more workflow demos

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Run lint checks:

```bash
npm run lint
```
