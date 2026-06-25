import type { ReactNode } from "react";

type CopyableOutputBoxProps = {
  title: string;
  children: ReactNode;
  buttonLabel: string;
  onCopy: () => void;
};

export default function CopyableOutputBox({
  title,
  children,
  buttonLabel,
  onCopy,
}: CopyableOutputBoxProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-white">{title}</p>
        <button
          type="button"
          onClick={onCopy}
          className="w-fit rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
        >
          {buttonLabel}
        </button>
      </div>
      {children}
    </div>
  );
}
