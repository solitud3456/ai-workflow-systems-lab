import type { ReactNode } from "react";
import ReviewStatusBadge from "@/components/demo/ReviewStatusBadge";

type AnalysisReviewCardProps = {
  approved: boolean;
  onApprove: () => void;
  children: ReactNode;
};

export default function AnalysisReviewCard({
  approved,
  onApprove,
  children,
}: AnalysisReviewCardProps) {
  return (
    <div className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-900/80 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-200">
            Saved AI analysis
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Human review required before using this output.
          </p>
        </div>
        <ReviewStatusBadge approved={approved} />
      </div>

      {children}

      <button
        type="button"
        onClick={onApprove}
        className="mt-4 rounded-full border border-cyan-400/40 px-5 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
      >
        Mark as human-reviewed
      </button>
    </div>
  );
}
