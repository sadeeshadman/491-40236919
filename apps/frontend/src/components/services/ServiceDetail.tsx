'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Service } from '@/lib/services';

type ServiceDetailProps = {
  service: Service;
  initialExpandedSubserviceId?: string | null;
};

export function ServiceDetail({ service, initialExpandedSubserviceId = null }: ServiceDetailProps) {
  const subserviceRefs = useRef<Record<string, HTMLElement | null>>({});
  const [expandedSubserviceId, setExpandedSubserviceId] = useState<string | null>(
    initialExpandedSubserviceId,
  );

  useEffect(() => {
    if (!initialExpandedSubserviceId) {
      return;
    }

    const targetSubservice = subserviceRefs.current[initialExpandedSubserviceId];
    if (typeof targetSubservice?.scrollIntoView === 'function') {
      targetSubservice.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialExpandedSubserviceId, service.slug]);

  function toggleSubservice(subserviceId: string) {
    setExpandedSubserviceId((previous) => (previous === subserviceId ? null : subserviceId));
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10 md:px-10 md:py-12">
      <div className="space-y-4">
        <p className="text-xs font-semibold tracking-[0.28em] text-slate-300 uppercase">Services</p>
        <h1 className="font-serif text-4xl text-white md:text-5xl">{service.name}</h1>
        <p className="max-w-4xl text-base leading-8 text-slate-200 md:text-lg">
          {service.overview}
        </p>
      </div>

      {service.subservices.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-serif text-2xl text-white">Subservices</h2>

          <div className="space-y-3">
            {service.subservices.map((subservice) => {
              const isExpanded = expandedSubserviceId === subservice.id;

              return (
                <article
                  key={subservice.id}
                  id={`subservice-${subservice.id}`}
                  ref={(element) => {
                    subserviceRefs.current[subservice.id] = element;
                  }}
                  className="scroll-mt-28 rounded-xl border border-slate-700 bg-slate-900/90"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubservice(subservice.id)}
                    aria-expanded={isExpanded}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-white">{subservice.name}</span>
                    <span className="text-slate-300">{isExpanded ? '−' : '+'}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-700 px-5 py-4">
                      <p className="text-sm leading-7 text-slate-200">{subservice.description}</p>
                      <Link
                        href="/#contact-us"
                        className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                      >
                        Request a Quote
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-6">
          <h2 className="font-serif text-2xl text-white">Subservices</h2>
          <p className="mt-3 text-sm leading-7 text-slate-200">
            This service is delivered as a comprehensive consulting offering with tailored scope
            based on project requirements.
          </p>
        </div>
      )}

      <div className="pt-2">
        <Link
          href="/#contact-us"
          className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Request a Quote
        </Link>
      </div>
    </section>
  );
}
