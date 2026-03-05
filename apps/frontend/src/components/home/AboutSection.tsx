import { SectionHeading } from './SectionHeading';

const reasonsToChoose = [
  'All-in-one team for inspection, management, construction, and engineering.',
  'Transparent communication and practical recommendations at every step.',
  'Balanced focus on safety, quality, and long-term property value.',
  'Local, responsive professionals dedicated to dependable service.',
];

export function AboutSection() {
  return (
    <section id="about-us" className="scroll-mt-28 space-y-8">
      <SectionHeading
        eyebrow="About Us"
        title="Who We Are and Why Homeowners Trust Constein Group"
        description="We are a multidisciplinary property team committed to making home decisions easier, safer, and more predictable for every client we serve."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="animate-fade-up-delay-1 relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-indigo-400/25 via-slate-900 to-slate-900 p-6">
          <div className="animate-soft-float pointer-events-none absolute -top-12 -right-14 h-32 w-32 rounded-full bg-indigo-300/20 blur-2xl" />
          <h3 className="font-serif text-2xl text-white">Who We Are</h3>
          <p className="mt-4 text-sm leading-7 text-slate-200 md:text-base">
            Constein Group brings together professionals from property operations, construction, and
            engineering disciplines. Our approach is collaborative and detail-oriented, helping
            clients protect their homes and invest with confidence.
          </p>
        </div>

        <div className="animate-fade-up-delay-2 relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br from-cyan-400/20 via-slate-900 to-slate-900 p-6">
          <div className="animate-soft-float pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />
          <h3 className="font-serif text-2xl text-white">Why Choose Us</h3>
          <ul className="mt-4 space-y-3">
            {reasonsToChoose.map((reason) => (
              <li key={reason} className="flex gap-3 text-sm leading-7 text-slate-200 md:text-base">
                <span className="mt-2 inline-block h-2 w-2 rounded-full bg-cyan-200" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
