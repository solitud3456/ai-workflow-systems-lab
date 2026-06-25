import type { ReactNode } from "react";

type DemoPanelProps = {
  children: ReactNode;
  className?: string;
};

export default function DemoPanel({
  children,
  className,
}: DemoPanelProps) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-6 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
