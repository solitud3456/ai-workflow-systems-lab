type ReviewStatusBadgeProps = {
  approved: boolean;
};

export default function ReviewStatusBadge({
  approved,
}: ReviewStatusBadgeProps) {
  return (
    <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300">
      {approved ? "Approved" : "Needs review"}
    </span>
  );
}
