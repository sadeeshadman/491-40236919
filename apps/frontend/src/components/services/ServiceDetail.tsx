'use client';

import { useEffect, useRef, useState } from 'react';
import { canRequestQuoteForSubservice } from '@/lib/services';
import type { Service, Subservice } from '@/lib/services';
import { QuoteRequestModal } from '@/components/modals/QuoteRequestModal';
import { apiFetch } from '@/lib/api';

type ServiceDetailProps = {
  service: Service;
  initialExpandedSubserviceId?: string | null;
};

type ServiceAudience = 'owner' | 'tenant';

type StartInspectionResponse = {
  inspection: {
    _id?: string;
    id?: string;
  };
};

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
  const [selectedSpecification, setSelectedSpecification] = useState<string | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isInspectorAuthenticated, setIsInspectorAuthenticated] = useState(false);
  const [reportAddress, setReportAddress] = useState('');
  const [reportPropertyType, setReportPropertyType] = useState<'Detached' | 'Condo' | 'Townhouse'>(
    'Detached',
  );
  const [isLaunchingReport, setIsLaunchingReport] = useState(false);
  const [reportLaunchError, setReportLaunchError] = useState('');

  const ownerSubservices = service.subservices.filter(
    (subservice) => subservice.audience === 'owner',
  );
  const tenantSubservices = service.subservices.filter(
    (subservice) => subservice.audience === 'tenant',
  );
  const hasAudienceSections = ownerSubservices.length > 0 && tenantSubservices.length > 0;

  useEffect(() => {
    if (service.slug !== 'home-inspection') {
      setIsInspectorAuthenticated(false);
      return;
    }

    let cancelled = false;

    async function checkInspectorSession() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          user?: {
            role?: string;
          };
        };

        const role = data.user?.role;
        if (!cancelled && (role === 'employee' || role === 'admin')) {
          setIsInspectorAuthenticated(true);
        }
      } catch {
        // If session lookup fails, keep tools hidden.
      }
    }

    void checkInspectorSession();

    return () => {
      cancelled = true;
    };
  }, [service.slug]);

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

  function openQuoteModal(specification?: string) {
    setSelectedSpecification(specification ?? null);
    setIsQuoteModalOpen(true);
  }

  function getInspectionId(response: StartInspectionResponse) {
    if (typeof response.inspection._id === 'string' && response.inspection._id) {
      return response.inspection._id;
    }

    if (typeof response.inspection.id === 'string' && response.inspection.id) {
      return response.inspection.id;
    }

    return null;
  }

  async function launchReportGenerator() {
    const trimmedAddress = reportAddress.trim();

    if (!trimmedAddress) {
      setReportLaunchError('Property address is required to start a report.');
      return;
    }

    setIsLaunchingReport(true);
    setReportLaunchError('');

    try {
      const response = await apiFetch<StartInspectionResponse>('/inspections/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyAddress: trimmedAddress,
          propertyType: reportPropertyType,
        }),
      });

      const inspectionId = getInspectionId(response);
      if (!inspectionId) {
        throw new Error('Inspection started but no id was returned.');
      }

      globalThis.open(`/report-generator/${inspectionId}`, '_self');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to start report generator right now.';
      setReportLaunchError(message);
      setIsLaunchingReport(false);
    }
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

                  {subservice.forms && subservice.forms.length > 0 ? (
                    <div className="mt-5 rounded-lg border border-slate-600/80 bg-slate-950/70 p-4">
                      <p className="text-xs font-semibold tracking-[0.2em] text-slate-300 uppercase">
                        Available Forms
                      </p>
                      <ul className="mt-3 space-y-2">
                        {subservice.forms.map((form) => (
                          <li key={form.id}>
                            <a
                              href={form.href}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex items-center justify-between rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-indigo-400 hover:bg-slate-800"
                            >
                              <span>{form.name}</span>
                              <span className="text-xs font-medium text-indigo-300 transition group-hover:text-indigo-200">
                                Open PDF
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {canRequestQuoteForSubservice(subservice) ? (
                    <button
                      type="button"
                      onClick={() => openQuoteModal(subservice.name)}
                      className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                      Request a Quote
                    </button>
                  ) : null}
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
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold tracking-[0.28em] text-slate-300 uppercase">
            Services
          </p>
          <h1 className="font-serif text-4xl text-white md:text-5xl">{service.name}</h1>
          <p className="text-base leading-8 text-slate-200 md:text-lg">{service.overview}</p>
        </div>

        {service.slug === 'home-inspection' && isInspectorAuthenticated ? (
          <div className="w-full max-w-md rounded-xl border border-indigo-400/35 bg-indigo-500/8 p-4">
            <p className="text-xs font-semibold tracking-[0.2em] text-indigo-200 uppercase">
              Inspector Tools
            </p>
            <p className="mt-1 text-sm text-slate-200">Start a new inspection workspace</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block text-sm text-slate-100">
                Property Address
                <input
                  value={reportAddress}
                  onChange={(event) => setReportAddress(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                  placeholder="123 Example Street, Ottawa"
                />
              </label>

              <label className="block text-sm text-slate-100">
                Property Type
                <select
                  value={reportPropertyType}
                  onChange={(event) =>
                    setReportPropertyType(event.target.value as 'Detached' | 'Condo' | 'Townhouse')
                  }
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                >
                  <option value="Detached">Detached</option>
                  <option value="Condo">Condo</option>
                  <option value="Townhouse">Townhouse</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void launchReportGenerator()}
              disabled={isLaunchingReport}
              className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLaunchingReport ? 'Opening...' : 'Open Report Generator'}
            </button>

            {reportLaunchError ? (
              <p className="mt-2 text-xs text-rose-300">{reportLaunchError}</p>
            ) : null}
          </div>
        ) : null}
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
        <button
          type="button"
          onClick={() => openQuoteModal()}
          className="inline-flex items-center rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Request a Quote
        </button>
      </div>

      <QuoteRequestModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        serviceName={service.name}
        specification={selectedSpecification}
        sourcePage={`/${service.slug}`}
      />
    </section>
  );
}
