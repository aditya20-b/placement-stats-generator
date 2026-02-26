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

  function handleRunId(runId: number) {
    startPolling(runId);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-5">
        <FlagToggles onChange={setActiveFlags} />
        <SettingsPanel onChange={setSpreadsheetId} />

        <div className="flex items-center gap-4 pt-1">
          <GenerateButton
            flags={activeFlags}
            spreadsheetId={spreadsheetId}
            onRunId={handleRunId}
            disabled={isRunning}
          />
          <StatusBadge status={status} elapsedSeconds={elapsedSeconds} />
        </div>

        {status === 'failed' && (
          <p className="text-sm text-red-600">
            Report generation failed. Check the{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              GitHub Actions logs
            </a>{' '}
            for details.
          </p>
        )}
        {status === 'timeout' && (
          <p className="text-sm text-orange-600">
            Polling timed out. The job may still be running. Check GitHub
            Actions for the result.
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600">
            Lost connection while polling status. Refresh the page to check for
            new reports.
          </p>
        )}
      </div>

      <LatestReport report={latestReport} />
    </div>
  );
}
