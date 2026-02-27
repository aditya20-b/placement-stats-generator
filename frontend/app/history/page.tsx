import { fetchReportsIndex } from '@/lib/reports';
import { HistoryList } from '@/components/HistoryList';
import type { ReportEntry } from '@/types/report';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  let reports: ReportEntry[] = [];
  try {
    reports = await fetchReportsIndex();
  } catch {
    // reports branch may not exist yet
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }} className="animate-fade-up-1">
        <p
          style={{
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
            margin: '0 0 6px',
          }}
        >
          Shiv Nadar University Chennai
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Report History
          </h1>
          {reports.length > 0 && (
            <span
              style={{
                padding: '2px 9px',
                borderRadius: '20px',
                background: 'var(--border)',
                fontSize: '12px',
                color: 'var(--text-2)',
                fontWeight: '500',
                position: 'relative',
                top: '-1px',
              }}
            >
              {reports.length}
            </span>
          )}
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-3)', margin: 0 }}>
          {reports.length === 0
            ? 'No reports generated yet'
            : 'B.Tech batch 2022–2026 · All generated reports, newest first'}
        </p>
      </div>

      <div className="animate-fade-up-2">
        <HistoryList reports={reports} />
      </div>
    </div>
  );
}
