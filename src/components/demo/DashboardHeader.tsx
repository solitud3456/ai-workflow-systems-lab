type DashboardHeaderProps = {
  title: string;
  description: string;
  countLabel: string;
  resetButtonLabel: string;
  onReset: () => void;
};

export default function DashboardHeader({
  title,
  description,
  countLabel,
  resetButtonLabel,
  onReset,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="w-fit rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/60 hover:text-cyan-200"
        >
          {resetButtonLabel}
        </button>
        <span className="w-fit rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          {countLabel}
        </span>
      </div>
    </div>
  );
}
