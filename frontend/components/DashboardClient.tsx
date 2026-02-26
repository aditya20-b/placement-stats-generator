'use client';

import { useState } from 'react';
import type { ReportEntry } from '@/types/report';
import { FlagToggles } from './FlagToggles';
import { SettingsPanel } from './SettingsPanel';
import { GenerateButton } from './GenerateButton';
import { StatusBadge } from './StatusBadge';
import { LatestReport } from './LatestReport';
import { useWorkflowPoller } from '@/hooks/useWorkflowPoller';

interface DashboardClientProps {
  latestReport: ReportEntry | null;
}

export function DashboardClient({ latestReport }: DashboardClientProps) {
  const [activeFlags, setActiveFlags] = useState<string[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState<string | undefined>();
  const { status, elapsedSeconds, startPolling } = useWorkflowPoller();

  const isRunning = status === 'queued' || status === 'in_progress';

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
        <FlagToggles onChange={setActiveFlags} />
        <SettingsPanel onChange={setSpreadsheetId} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
          <GenerateButton
            flags={activeFlags}
            spreadsheetId={spreadsheetId}
            onRunId={(runId) => startPolling(runId)}
            disabled={isRunning}
          />
          <StatusBadge status={status} elapsedSeconds={elapsedSeconds} />
        </div>

        {status === 'failed' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(220,38,38,0.15)',
              fontSize: '13px',
              color: 'var(--danger)',
            }}
            className="animate-fade-up"
          >
            Generation failed. Check GitHub Actions for details.
          </div>
        )}
        {status === 'timeout' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--warning-bg)',
              border: '1px solid rgba(180,83,9,0.15)',
              fontSize: '13px',
              color: 'var(--warning)',
            }}
            className="animate-fade-up"
          >
            Polling timed out. The job may still be running — check GitHub Actions.
          </div>
        )}
        {status === 'error' && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(220,38,38,0.15)',
              fontSize: '13px',
              color: 'var(--danger)',
            }}
            className="animate-fade-up"
          >
            Lost connection while polling. Refresh to check for new reports.
          </div>
        )}
      </div>

      {/* Latest report */}
      <LatestReport report={latestReport} />
    </div>
  );
}
