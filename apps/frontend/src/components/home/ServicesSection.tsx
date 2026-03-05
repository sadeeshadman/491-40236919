import Link from 'next/link';
import { services } from '@/lib/services';
import { SectionHeading } from './SectionHeading';

const serviceStyles: Record<string, { tone: string; glow: string }> = {
  'home-inspection': {
    tone: 'from-blue-900/70 via-slate-900 to-slate-900',
    glow: 'bg-blue-300/15',
  },
  'property-management': {
    tone: 'from-teal-900/70 via-slate-900 to-slate-900',
    glow: 'bg-teal-300/15',
  },
  'construction-services': {
    tone: 'from-indigo-900/70 via-slate-900 to-slate-900',
    glow: 'bg-indigo-300/15',
  },
  'engineering-consultants': {
    tone: 'from-slate-800/80 via-slate-900 to-slate-900',
    glow: 'bg-slate-400/15',
  },
};

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
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className={`animate-fade-up-delay-1 group relative overflow-hidden rounded-xl border border-slate-700 bg-gradient-to-br p-5 transition duration-300 hover:-translate-y-1 hover:border-slate-500 ${serviceStyles[service.slug].tone}`}
            style={{ animationDelay: `${120 + index * 90}ms` }}
          >
            <div
              className={`pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl ${serviceStyles[service.slug].glow}`}
            />
            <h3 className="font-serif text-xl text-white">{service.name}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200">{service.shortDescription}</p>
            <p className="mt-4 text-sm font-semibold text-slate-200">View Service</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
