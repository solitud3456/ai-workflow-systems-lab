type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
}: PageHeaderProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
        {eyebrow}
      </p>

      <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {title}
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
        {description}
      </p>
    </div>
  );
}