import { SectionHeading } from './SectionHeading';

const services = [
  {
    title: 'Home Inspection',
    description:
      'Comprehensive property inspections that identify risks early and help you make confident home decisions.',
    tone: 'from-cyan-400/30 via-slate-900 to-slate-900',
    glow: 'bg-cyan-300/25',
  },
  {
    title: 'Property Management',
    description:
      'Reliable management support for maintenance coordination, tenant communication, and long-term asset care.',
    tone: 'from-emerald-400/30 via-slate-900 to-slate-900',
    glow: 'bg-emerald-300/20',
  },
  {
    title: 'Construction Services',
    description:
      'Structured project delivery for renovations and upgrades with clear timelines, quality checks, and execution.',
    tone: 'from-amber-400/30 via-slate-900 to-slate-900',
    glow: 'bg-amber-300/25',
  },
  {
    title: 'Engineering Consultants',
    description:
      'Technical consulting for structural and systems planning to keep your project safe, efficient, and compliant.',
    tone: 'from-fuchsia-400/25 via-slate-900 to-slate-900',
    glow: 'bg-fuchsia-300/20',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-28 space-y-8">
      <SectionHeading
        eyebrow="Services"
        title="Complete Property Support from a Single Team"
        description="From inspections to engineering guidance, our four specialized services work together to simplify every stage of your home and property needs."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {services.map((service, index) => (
          <article
            key={service.title}
            className={`animate-fade-up-delay-1 group relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-500 ${service.tone}`}
            style={{ animationDelay: `${120 + index * 90}ms` }}
          >
            <div
              className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl ${service.glow}`}
            />
            <h3 className="font-serif text-xl text-white">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
