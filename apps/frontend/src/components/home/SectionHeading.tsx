type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="animate-fade-up max-w-3xl space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-0.5 w-8 rounded-full bg-cyan-300" />
        <p className="text-xs font-semibold tracking-[0.28em] text-cyan-200 uppercase">{eyebrow}</p>
      </div>
      <h2 className="font-serif text-3xl leading-tight text-white md:text-4xl">{title}</h2>
      <p className="text-base leading-7 text-slate-200 md:text-lg">{description}</p>
    </div>
  );
}
