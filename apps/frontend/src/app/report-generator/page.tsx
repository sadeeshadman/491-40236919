import { SiteHeader } from '@/components/layout/SiteHeader';
import { MyReportsDashboard } from '@/components/report-generator/MyReportsDashboard';

export default function ReportsDashboardPage() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="absolute top-[22rem] -right-28 h-96 w-96 rounded-full bg-slate-500/12 blur-3xl" />
      </div>

      <SiteHeader />

      <main className="relative mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-5 rounded-xl border border-slate-700 bg-slate-900/90 p-4">
          <p className="text-xs tracking-[0.2em] text-slate-400 uppercase">Report Generator</p>
          <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">My Reports</h1>
          <p className="mt-1 text-sm text-slate-300">
            Open saved reports, continue drafts, and download finalized PDFs.
          </p>
        </div>

        <MyReportsDashboard />
      </main>
    </div>
  );
}
