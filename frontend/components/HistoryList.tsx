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
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <p className="text-sm text-zinc-500">No reports found.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(reports.length / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const visible = reports.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="space-y-4">
        {visible.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {start + 1}–{Math.min(start + PAGE_SIZE, reports.length)} of{' '}
            {reports.length} reports
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
