import type { ReportEntry } from '@/types/report';

interface LatestReportProps {
  report: ReportEntry | null;
}

export function LatestReport({ report }: LatestReportProps) {
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <p className="text-sm text-zinc-500">No reports generated yet.</p>
        <p className="mt-1 text-xs text-zinc-400">
          Click &ldquo;Generate Report&rdquo; to create your first report.
        </p>
      </div>
    );
  }

  const { stats, timestamp, filename } = report;

  function formatDate(ts: string) {
    return new Date(ts).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Latest Report
          </h3>
          <p className="mt-1 text-sm text-zinc-600">{formatDate(timestamp)}</p>
        </div>
        <a
          href={`/api/download/${filename}`}
          download={filename}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M8 1v10M4 8l4 4 4-4M1 14h14" />
          </svg>
          Download PDF
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <BigStat
          label="Placed"
          value={String(stats.placed)}
          sub={`of ${stats.optPlacement} opted`}
        />
        <BigStat
          label="Placement Rate"
          value={`${stats.placementPercent}%`}
        />
        <BigStat
          label="Companies"
          value={String(stats.totalCompanies)}
        />
        <BigStat label="Median CTC" value={`₹${stats.medianCtc}L`} />
      </div>
    </div>
  );
}

function BigStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}
