import Link from "next/link";

type InfoCardProps = {
  title: string;
  description: string;
  tag?: string;
  href?: string;
};

export default function InfoCard({
  title,
  description,
  tag,
  href,
}: InfoCardProps) {
  const cardContent = (
    <article className="h-full rounded-2xl border border-slate-800 bg-slate-900/70 p-6 transition hover:border-cyan-500/40">
      {tag ? (
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          {tag}
        </span>
      ) : null}

      <h2
        className={
          tag
            ? "mt-5 text-xl font-semibold text-white"
            : "text-xl font-semibold text-white"
        }
      >
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>

      {href ? (
        <p className="mt-5 text-sm font-semibold text-cyan-300">
          Open demo →
        </p>
      ) : null}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}