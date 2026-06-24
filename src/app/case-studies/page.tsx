import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const workflowSteps = [
  "Capture a messy customer inquiry as a structured lead record.",
  "Track the lead status, follow-up date, source, and internal notes.",
  "Generate a structured manual AI prompt for the selected lead.",
  "Paste the AI JSON result back into the app.",
  "Save the analysis with summary, urgency, intent, next action, risk note, and suggested reply.",
  "Mark the analysis as human-reviewed before treating it as ready.",
  "Copy the suggested reply for practical follow-up.",
];

const valuePoints = [
  "AI workflow design around a real business process, not a one-off text generator.",
  "Structured outputs that can be saved, reviewed, counted, and reused.",
  "Human-in-the-loop review so AI suggestions stay assistive rather than automatic.",
  "Local persistence with dashboard metrics for saved analyses and reviewed work.",
  "A clear bridge from manual AI usage to future automation.",
];

const limitations = [
  "Manual AI mode only: the user still copies the prompt into ChatGPT or Claude.",
  "LocalStorage only: records stay in the browser and are not shared across devices.",
  "No real database, authentication, CRM, email, or AI API integration yet.",
];

const nextUpgrades = [
  "Database storage for persistent lead records and saved analyses.",
  "Authentication for private user workspaces.",
  "Real CRM, email, website form, or Zalo-style intake integrations.",
  "Automated AI API mode alongside the current manual mode.",
  "Export and reporting for follow-up performance and pipeline review.",
];

const recruitmentWorkflowSteps = [
  "Capture candidate details, application text, source, and internal recruiter notes.",
  "Track each candidate through New, Screening, Interview, Offer, or Rejected status.",
  "Generate a structured manual AI screening prompt for the selected candidate.",
  "Paste the AI JSON result back into the app.",
  "Save the candidate summary, fit signal, strengths, concerns, next action, risk note, and interview questions.",
  "Review the saved analysis and explicitly mark it as human-reviewed.",
  "Copy the suggested interview questions for practical screening preparation.",
];

const recruitmentValuePoints = [
  "AI-assisted HR workflow design around candidate screening rather than isolated text generation.",
  "Structured JSON outputs that can be saved, reviewed, measured, and reused.",
  "Human-in-the-loop review that keeps recruiters responsible for decisions and follow-up.",
  "Dashboard metrics for candidate status, saved analyses, and completed human review.",
  "Practical screening support without treating AI fit signals as final hiring decisions.",
];

const recruitmentLimitations = [
  "Manual AI mode only: the user copies the prompt into ChatGPT or Claude and pastes the JSON result back.",
  "LocalStorage only: candidate records stay in one browser and are not suitable for real applicant data.",
  "No real database, authentication, applicant tracking system, email integration, or live AI API yet.",
];

const recruitmentNextUpgrades = [
  "Database storage for candidate records, screening analyses, and review history.",
  "Authentication and private recruiter workspaces.",
  "Applicant tracking system integration for synchronized candidate status.",
  "Email and calendar integration for interview coordination.",
  "Export and reporting for pipeline review and screening activity.",
  "Automated AI API mode with explicit review controls before action.",
];

const documentWorkflowSteps = [
  "Capture the document title, type, source, pasted text, and internal review notes.",
  "Track each document through New, Reviewing, Needs info, Approved, or Archived status.",
  "Generate a structured manual AI extraction prompt for the selected document.",
  "Paste the AI JSON document analysis back into the app.",
  "Save the summary, key points, missing information, action items, risk note, and next action.",
  "Review the saved analysis and explicitly mark it as human-reviewed.",
  "Copy the action items for practical document follow-up.",
];

const documentValuePoints = [
  "AI-assisted document workflow design instead of an isolated summarization prompt.",
  "Structured extraction that separates key points, missing information, action items, and uncertainty.",
  "Human-in-the-loop review so AI output remains evidence to verify rather than final truth.",
  "Dashboard metrics for document status, saved analyses, and completed human review.",
  "Practical document handling that can be tested before adding file-processing infrastructure.",
];

const documentLimitations = [
  "Manual AI mode only: the user copies the prompt into ChatGPT or Claude and pastes the JSON result back.",
  "LocalStorage only: document records stay in one browser and are not suitable for shared or sensitive production data.",
  "No real database, authentication, file upload, OCR, document parsing, or live AI API yet.",
];

const documentNextUpgrades = [
  "Database storage for document records, analyses, and review history.",
  "Authentication and private workspaces.",
  "File upload for common document formats.",
  "OCR and document parsing for scanned files and structured extraction.",
  "Export and reporting for document queues, actions, and review status.",
  "Automated AI API mode with explicit review controls before action.",
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Case Studies"
          title="Proof of workflow thinking, not just screenshots."
          description="Each case study explains the business problem, manual process, AI-assisted workflow, data model, human review pattern, limitations, and future automation path."
        />

        <article className="mt-10">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  Portfolio lab case study
                </span>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                  Lead Follow-up Assistant
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                  This demo explores how a small business could turn scattered
                  customer inquiries into structured lead records, AI-assisted
                  analysis, human-reviewed replies, and visible follow-up status
                  without pretending there is a live AI or production CRM behind it.
                </p>
              </div>

              <Link
                href="/demos/lead-follow-up"
                className="w-fit rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Open live demo
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Problem</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Small businesses receive messy customer inquiries from website
                forms, Facebook messages, email, Zalo, referrals, and other
                informal channels. The important details are often mixed into
                free text, follow-ups can be forgotten, and reply quality depends
                on who happens to respond.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Why it matters</h3>
              <ul className="mt-3 space-y-3">
                {valuePoints.map((point) => (
                  <li key={point} className="text-sm leading-6 text-slate-400">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold text-white">Workflow</h3>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {workflowSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300"
                >
                  <span className="mr-2 font-semibold text-cyan-300">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Current limitation
              </h3>
              <ul className="mt-3 space-y-3">
                {limitations.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Next upgrades</h3>
              <ul className="mt-3 space-y-3">
                {nextUpgrades.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <article className="mt-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  Portfolio lab case study
                </span>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                  Recruitment Workflow Assistant
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                  This demo explores how candidate information can move from
                  scattered notes into structured screening support, suggested
                  interview questions, and human-reviewed next steps. It
                  demonstrates the workflow honestly without presenting AI as
                  an autonomous recruiter or final hiring authority.
                </p>
              </div>

              <Link
                href="/demos/recruitment-assistant"
                className="w-fit rounded-full border border-cyan-400/60 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
              >
                Open recruitment demo
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Problem</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Hiring teams often receive messy candidate notes, resumes,
                referrals, application text, and recruiter comments from
                several channels. Important evidence can be difficult to
                compare, screening questions may vary between candidates, and
                next steps can become unclear without a shared workflow.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Why it matters
              </h3>
              <ul className="mt-3 space-y-3">
                {recruitmentValuePoints.map((point) => (
                  <li key={point} className="text-sm leading-6 text-slate-400">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold text-white">Workflow</h3>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {recruitmentWorkflowSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300"
                >
                  <span className="mr-2 font-semibold text-cyan-300">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Current limitation
              </h3>
              <ul className="mt-3 space-y-3">
                {recruitmentLimitations.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Next upgrades
              </h3>
              <ul className="mt-3 space-y-3">
                {recruitmentNextUpgrades.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <article className="mt-16">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                  Portfolio lab case study
                </span>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                  Document Intake Assistant
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                  This demo explores how pasted document text can move from an
                  unstructured source into a saved summary, key points, missing
                  information, action items, and human-reviewed next steps. It
                  demonstrates document assistance without presenting AI output
                  as verified fact or a replacement for human review.
                </p>
              </div>

              <Link
                href="/demos/document-intake"
                className="w-fit rounded-full border border-cyan-400/60 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
              >
                Open document demo
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Problem</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Businesses often receive messy document text from forms,
                emails, reports, notes, policies, requests, and copied
                documents. Important details can be buried in free text,
                missing information may go unnoticed, and follow-up actions can
                remain unclear without a consistent review workflow.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Why it matters
              </h3>
              <ul className="mt-3 space-y-3">
                {documentValuePoints.map((point) => (
                  <li key={point} className="text-sm leading-6 text-slate-400">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold text-white">Workflow</h3>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {documentWorkflowSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300"
                >
                  <span className="mr-2 font-semibold text-cyan-300">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Current limitation
              </h3>
              <ul className="mt-3 space-y-3">
                {documentLimitations.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Next upgrades
              </h3>
              <ul className="mt-3 space-y-3">
                {documentNextUpgrades.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>
      </section>
    </main>
  );
}
