type MetricCardProps = {
  label: string;
  value: number | string;
};

export default function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
