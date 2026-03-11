'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { InspectionDocument } from '@/lib/inspection';

type SessionResponse = {
  user?: {
    id?: string;
    role?: string;
    email?: string;
    name?: string;
  };
};

type InspectionsResponse = {
  inspections: InspectionDocument[];
};

function formatDate(value?: string) {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
}

export function MyReportsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<InspectionDocument[]>([]);
  const [isInspector, setIsInspector] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setIsLoading(true);
      setError(null);

      try {
        const sessionResponse = await fetch('/api/auth/session', { cache: 'no-store' });
        const session = (await sessionResponse.json()) as SessionResponse;

        const role = session.user?.role;
        const userId = session.user?.id;

        if (role !== 'employee' && role !== 'admin') {
          if (!cancelled) {
            setIsInspector(false);
            setReports([]);
          }
          return;
        }

        if (!userId) {
          if (!cancelled) {
            setError('Missing user id on session. Please sign in again.');
            setIsInspector(true);
            setReports([]);
          }
          return;
        }

        const response = await apiFetch<InspectionsResponse>(
          `/inspections?authorId=${encodeURIComponent(userId)}`,
        );

        if (!cancelled) {
          setIsInspector(true);
          setReports(response.inspections);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load reports.';
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  const reportCounts = useMemo(() => {
    const draftCount = reports.filter((report) => report.status === 'Draft').length;
    const finalizedCount = reports.filter((report) => report.status === 'Finalized').length;

    return {
      draftCount,
      finalizedCount,
      total: reports.length,
    };
  }, [reports]);

  if (isLoading) {
    return <p className="text-slate-300">Loading your reports...</p>;
  }

  if (error) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!isInspector) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5">
        <p className="text-sm text-slate-300">
          Sign in with an inspector account to view saved reports.
        </p>
        <Link
          href="/api/auth/signin"
          className="mt-3 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-4">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Total</p>
          <p className="mt-1 text-2xl font-semibold text-white">{reportCounts.total}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-4">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Draft</p>
          <p className="mt-1 text-2xl font-semibold text-amber-300">{reportCounts.draftCount}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/90 p-4">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Finalized</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">
            {reportCounts.finalizedCount}
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5">
          <p className="text-sm text-slate-300">
            No reports found yet. Start one from Home Inspection.
          </p>
          <Link
            href="/home-inspection"
            className="mt-3 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Go to Home Inspection
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => (
            <li key={report._id} className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{report.propertyAddress}</h3>
                  <p className="mt-1 text-xs text-slate-300">{report.propertyType}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Last updated: {formatDate(report.updatedAt)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    report.status === 'Finalized'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/report-generator/${report._id}`}
                  className="inline-flex rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                >
                  Open Report
                </Link>
                <a
                  href={`/api/inspections/${report._id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-md border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
                >
                  Download PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
