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

  return (
    <div>
      {/* Page header */}
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
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--text)',
            margin: '0 0 4px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
          }}
        >
          Placement Report Generator
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-3)', margin: 0 }}>
          B.Tech graduating batch &nbsp;·&nbsp; 2022 – 2026
        </p>
      </div>

      <DashboardClient initialReports={reports} />
    </div>
  );
}
