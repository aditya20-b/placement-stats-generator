import type { ReportEntry } from '@/types/report';

interface ReportCardProps {
  report: ReportEntry;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

const FLAG_LABELS: Record<string, string> = {
  '--sections': 'Sections',
  '--gender': 'Gender',
  '--companies': 'Companies',
  '--no-ctc': 'No CTC',
  '--no-timeline': 'No Timeline',
  '--ctc-brackets': 'CTC Brackets',
  '--no-charts': 'No Charts',
};

export function ReportCard({ report }: ReportCardProps) {
  const { stats, flags, timestamp, filename } = report;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{formatDate(timestamp)}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {flags.length === 0 ? (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                Default
              </span>
            ) : (
              flags.map((f) => (
                <span
                  key={f}
                  className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                >
                  {FLAG_LABELS[f] ?? f}
                </span>
              ))
            )}
          </div>
        </div>
        <a
          href={`/api/download/${filename}`}
          download={filename}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          <svg
            className="h-3.5 w-3.5"
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCell
          label="Placed"
          value={`${stats.placed} / ${stats.optPlacement}`}
        />
        <StatCell label="Placement %" value={`${stats.placementPercent}%`} />
        <StatCell label="Companies" value={String(stats.totalCompanies)} />
        <StatCell label="Median CTC" value={`₹${stats.medianCtc}L`} />
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}
