import { fetchReportsIndex } from '@/lib/reports';
import { DashboardClient } from '@/components/DashboardClient';
import type { ReportEntry } from '@/types/report';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let reports: ReportEntry[] = [];
  try {
    reports = await fetchReportsIndex();
  } catch {
    // reports branch may not exist yet
  }

  const latestReport = reports[0] ?? null;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }} className="animate-fade-up-1">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '4px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: '400',
              color: 'var(--text)',
              margin: 0,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
          >
            Report Generator
          </h1>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-3)', margin: 0 }}>
          Shiv Nadar University Chennai &nbsp;·&nbsp; Batch 2025
        </p>
      </div>

      <DashboardClient latestReport={latestReport} />
    </div>
  );
}
