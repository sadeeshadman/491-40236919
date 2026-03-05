'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Service, Subservice } from '@/lib/services';

type ServiceDetailProps = {
  service: Service;
  initialExpandedSubserviceId?: string | null;
};

type ServiceAudience = 'owner' | 'tenant';

export function ServiceDetail({ service, initialExpandedSubserviceId = null }: ServiceDetailProps) {
  const subserviceRefs = useRef<Record<string, HTMLElement | null>>({});
  const ownerSectionRef = useRef<HTMLDivElement | null>(null);
  const tenantSectionRef = useRef<HTMLDivElement | null>(null);
  const selectedSubservice = service.subservices.find(
    (subservice) => subservice.id === initialExpandedSubserviceId,
  );
  const initialAudience: ServiceAudience =
    selectedSubservice?.audience === 'tenant' ? 'tenant' : 'owner';
  const [expandedSubserviceId, setExpandedSubserviceId] = useState<string | null>(
    initialExpandedSubserviceId,
  );
  const [selectedAudience, setSelectedAudience] = useState<ServiceAudience>(initialAudience);

  const ownerSubservices = service.subservices.filter(
    (subservice) => subservice.audience === 'owner',
  );
  const tenantSubservices = service.subservices.filter(
    (subservice) => subservice.audience === 'tenant',
  );
  const hasAudienceSections = ownerSubservices.length > 0 && tenantSubservices.length > 0;

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

  function scrollToAudienceSection(audience: ServiceAudience) {
    const section = audience === 'owner' ? ownerSectionRef.current : tenantSectionRef.current;

    if (typeof section?.scrollIntoView === 'function') {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleAudienceSelection(audience: ServiceAudience) {
    setSelectedAudience(audience);
    scrollToAudienceSection(audience);
  }

  function renderSubserviceList(subservices: Subservice[]) {
    return (
      <div className="space-y-3">
        {subservices.map((subservice) => {
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
    );
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
          {hasAudienceSections ? (
            <>
              <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
                <p className="text-sm font-semibold text-white">
                  I&apos;m looking for services as:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAudienceSelection('owner')}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      selectedAudience === 'owner'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAudienceSelection('tenant')}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                      selectedAudience === 'tenant'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    Tenant
                  </button>
                </div>
              </div>

              <div ref={ownerSectionRef} className="scroll-mt-28 space-y-3">
                <h2 className="font-serif text-2xl text-white">Services for Owners</h2>
                {renderSubserviceList(ownerSubservices)}
              </div>

              <div ref={tenantSectionRef} className="scroll-mt-28 space-y-3">
                <h2 className="font-serif text-2xl text-white">Services for Tenants</h2>
                {renderSubserviceList(tenantSubservices)}
              </div>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl text-white">Subservices</h2>
              {renderSubserviceList(service.subservices)}
            </>
          )}
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
