import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Workflow Systems Lab",
  description:
    "A solo-built portfolio lab for practical AI-assisted business workflow systems.",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/demos", label: "Demos" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/methods", label: "Methods" },
  { href: "/about", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-semibold tracking-tight text-white">
                AI Workflow Systems Lab
              </Link>

              <div className="flex gap-4 text-sm text-slate-300">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-cyan-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </header>

          {children}

          <footer className="border-t border-slate-800 bg-slate-950">
            <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold tracking-tight text-white">
                  AI Workflow Systems Lab
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Manual-AI workflow prototypes built as a portfolio lab.
                </p>
              </div>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-400"
              >
                <Link
                  href="/demos"
                  className="transition hover:text-cyan-300"
                >
                  Demos
                </Link>
                <Link
                  href="/case-studies"
                  className="transition hover:text-cyan-300"
                >
                  Case Studies
                </Link>
                <Link
                  href="/methods"
                  className="transition hover:text-cyan-300"
                >
                  Methods
                </Link>
                <a
                  href="https://github.com/solitud3456/ai-workflow-systems-lab"
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-cyan-300"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
