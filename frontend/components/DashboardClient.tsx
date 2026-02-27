'use client';

import { useState, useCallback } from 'react';
import type { ReportEntry } from '@/types/report';
import { FlagToggles } from './FlagToggles';
import { SettingsPanel } from './SettingsPanel';
import { GenerateButton } from './GenerateButton';
import { StatusBadge } from './StatusBadge';
import { LatestReport } from './LatestReport';
import { ReportCard } from './ReportCard';
import { useWorkflowPoller } from '@/hooks/useWorkflowPoller';

interface DashboardClientProps {
  initialReports: ReportEntry[];
}

export function DashboardClient({ initialReports }: DashboardClientProps) {
  const [additiveFlags, setAdditiveFlags] = useState<string[]>([]);
  const [advancedFlags, setAdvancedFlags] = useState<string[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState<string | undefined>();
  const activeFlags = [...additiveFlags, ...advancedFlags];
  const [reports, setReports] = useState<ReportEntry[]>(initialReports);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFreshReports = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const fresh = await res.json() as ReportEntry[];
        setReports(fresh);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const { status, elapsedSeconds, startPolling } = useWorkflowPoller(fetchFreshReports);

  const isRunning = status === 'queued' || status === 'in_progress';
  const latest = reports[0] ?? null;
  const recent = reports.slice(1, 3); // 2nd and 3rd most recent

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Generator card */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
        className="animate-fade-up-2"
      >
        <FlagToggles onChange={setAdditiveFlags} />
        <SettingsPanel onChange={setSpreadsheetId} onFlagsChange={setAdvancedFlags} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
          <GenerateButton
            flags={activeFlags}
            spreadsheetId={spreadsheetId}
            onRunId={(runId) => startPolling(runId)}
            disabled={isRunning}
          />
          <StatusBadge status={status} elapsedSeconds={elapsedSeconds} />
          {refreshing && (
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
              Fetching latest…
            </span>
          )}
        </div>

        {status === 'failed' && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.15)', fontSize: '13px', color: 'var(--danger)' }} className="animate-fade-up">
            Generation failed. Check GitHub Actions for details.
          </div>
        )}
        {status === 'timeout' && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)', border: '1px solid rgba(180,83,9,0.15)', fontSize: '13px', color: 'var(--warning)' }} className="animate-fade-up">
            Polling timed out. The job may still be running — check GitHub Actions.
          </div>
        )}
        {status === 'error' && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-bg)', border: '1px solid rgba(220,38,38,0.15)', fontSize: '13px', color: 'var(--danger)' }} className="animate-fade-up">
            Lost connection while polling. Refresh to check for new reports.
          </div>
        )}
      </div>

      {/* Latest report — prominent */}
      <LatestReport report={latest} />

      {/* Previous 2 reports — compact */}
      {recent.length > 0 && (
        <div className="animate-fade-up-4">
          <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Previous Reports
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recent.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
