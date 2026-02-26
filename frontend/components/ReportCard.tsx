import type { ReportEntry } from '@/types/report';

interface ReportCardProps {
  report: ReportEntry;
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

const FLAG_SHORT: Record<string, string> = {
  '--sections':    'Sections',
  '--gender':      'Gender',
  '--companies':   'Companies',
  '--no-ctc':      'No CTC',
  '--no-timeline': 'No Timeline',
  '--ctc-brackets':'CTC Brackets',
  '--no-charts':   'No Charts',
};

export function ReportCard({ report }: ReportCardProps) {
  const { stats, flags, timestamp, filename } = report;
  const { date, time } = formatDate(timestamp);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
    >
      <div>
        {/* Date + flags row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text)' }}>
            {date}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{time}</span>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {flags.length === 0 ? (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  fontSize: '11px',
                  color: 'var(--text-3)',
                  fontWeight: '450',
                }}
              >
                Default
              </span>
            ) : (
              flags.map((f) => (
                <span
                  key={f}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--accent-bg)',
                    border: '1px solid rgba(29,78,216,0.15)',
                    fontSize: '11px',
                    color: 'var(--accent)',
                    fontWeight: '500',
                  }}
                >
                  {FLAG_SHORT[f] ?? f}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { label: 'Placed',    value: `${stats.placed}/${stats.optPlacement}` },
            { label: 'Rate',      value: `${stats.placementPercent}%` },
            { label: 'Companies', value: String(stats.totalCompanies) },
            { label: 'Median',    value: `₹${stats.medianCtc}L` },
          ].map((s) => (
            <div key={s.label}>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '1px' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <a
        href={`/api/download/${filename}`}
        download={filename}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 14px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-2)',
          textDecoration: 'none',
          fontSize: '12px',
          fontWeight: '500',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
          (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
          (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M5.5 1v7M2.5 5.5l3 3 3-3M1 9.5h9"/>
        </svg>
        PDF
      </a>
    </div>
  );
}
