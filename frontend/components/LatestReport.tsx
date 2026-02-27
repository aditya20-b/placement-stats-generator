import type { ReportEntry } from '@/types/report';

interface LatestReportProps {
  report: ReportEntry | null;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function LatestReport({ report }: LatestReportProps) {
  if (!report) {
    return (
      <div
        style={{
          border: '1.5px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px 32px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--border)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--text-3)" strokeWidth="1.5">
            <path d="M3 5h12M3 9h12M3 13h7" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', margin: '0 0 4px' }}>
          No reports yet
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>
          Generate your first report using the form above
        </p>
      </div>
    );
  }

  const { stats, timestamp, filename, flags } = report;

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}
      className="animate-fade-up-3"
    >
      {/* Header band */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 60%, #2563EB 100%)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Latest Report &nbsp;·&nbsp; Batch 2022–2026
          </p>
          <p style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 2px' }}>
            {formatDate(timestamp)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
            {formatTime(timestamp)}
            {flags.length > 0 && (
              <span style={{ marginLeft: '8px' }}>
                · {flags.map(f => f.replace('--', '')).join(', ')}
              </span>
            )}
          </p>
        </div>
        <a
          href={`/api/download/${filename}`}
          download={filename}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            textDecoration: 'none',
            fontSize: '12.5px',
            fontWeight: '500',
            flexShrink: 0,
            backdropFilter: 'blur(4px)',
            transition: 'background 0.15s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M6 1v7M3 6l3 3 3-3M1 10h10"/>
          </svg>
          Download PDF
        </a>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0',
        }}
      >
        {[
          { label: 'Placed',         value: String(stats.placed),              sub: `of ${stats.optPlacement} opted` },
          { label: 'Placement Rate', value: `${stats.placementPercent}%`,      sub: 'overall' },
          { label: 'Companies',      value: String(stats.totalCompanies),       sub: 'recruiters' },
          { label: 'Median CTC',     value: `₹${stats.medianCtc}L`,           sub: 'per annum' },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: '20px 24px',
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              borderTop: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '0 0 4px', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {s.label}
            </p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text)', margin: '0 0 2px', lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ fontSize: '11.5px', color: 'var(--text-3)', margin: 0 }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
