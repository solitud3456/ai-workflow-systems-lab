export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          About
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          A solo-built AI workflow portfolio lab.
        </h1>

        <div className="mt-8 space-y-6 text-lg leading-8 text-slate-300">
          <p>
            AI Workflow Systems Lab is a learning and portfolio project focused
            on practical business workflows, not vague AI hype.
          </p>

          <p>
            The goal is to build proof for future job applications by showing
            working demos, clear documentation, human review patterns, and
            realistic limitations.
          </p>

          <p>
            This project is built step by step with Next.js, TypeScript,
            Tailwind CSS, ChatGPT, Claude, Git, and practical manual review.
          </p>
        </div>
      </section>
    </main>
  );
}