'use client';

import { useState } from 'react';
import type { ReportEntry } from '@/types/report';
import { ReportCard } from './ReportCard';

interface HistoryListProps {
  reports: ReportEntry[];
}

const PAGE_SIZE = 10;

export function HistoryList({ reports }: HistoryListProps) {
  const [page, setPage] = useState(0);

  if (reports.length === 0) {
    return (
      <div
        style={{
          border: '1.5px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '64px 32px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-2)', margin: '0 0 4px' }}>
          No reports found
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>
          Generated reports will appear here
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = reports.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visible.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <p style={{ fontSize: '12.5px', color: 'var(--text-3)' }}>
            {start + 1}–{Math.min(start + PAGE_SIZE, reports.length)} of {reports.length}
          </p>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { label: '← Prev', action: () => setPage((p) => Math.max(0, p - 1)), disabled: page === 0 },
              { label: 'Next →', action: () => setPage((p) => Math.min(totalPages - 1, p + 1)), disabled: page === totalPages - 1 },
            ].map(({ label, action, disabled }) => (
              <button
                key={label}
                onClick={action}
                disabled={disabled}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: disabled ? 'var(--text-3)' : 'var(--text-2)',
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: '450',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
