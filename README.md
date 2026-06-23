# AI Workflow Systems Lab

A portfolio lab for building practical AI-assisted workflow prototypes.

This project is a beginner-friendly but serious portfolio project focused on learning how AI can fit inside real business workflows. It is not a fake agency and does not claim to have clients. The goal is to build small working demos that show workflow thinking, structured AI outputs, human review, saved state, and clear limitations.

## Current Live Demo

### Lead Follow-up Assistant

The first working demo is the Lead Follow-up Assistant. It shows how a messy customer inquiry can become a structured lead record, an AI-assisted analysis, and a human-reviewed follow-up draft.

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
- CRM/email integrations
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
