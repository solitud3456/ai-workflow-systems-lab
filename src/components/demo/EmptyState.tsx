type EmptyStateProps = {
  title: string;
  description: string;
};

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
