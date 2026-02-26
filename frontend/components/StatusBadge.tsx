'use client';

import type { WorkflowStatus } from '@/hooks/useWorkflowPoller';

interface StatusBadgeProps {
  status: WorkflowStatus;
  elapsedSeconds: number;
}

const CONFIG: Record<
  WorkflowStatus,
  { label: string; color: string; animate: boolean }
> = {
  idle: { label: 'Idle', color: 'bg-zinc-100 text-zinc-500', animate: false },
  queued: {
    label: 'Queued',
    color: 'bg-amber-100 text-amber-700',
    animate: true,
  },
  in_progress: {
    label: 'Running',
    color: 'bg-blue-100 text-blue-700',
    animate: true,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700',
    animate: false,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-700',
    animate: false,
  },
  timeout: {
    label: 'Timed out',
    color: 'bg-orange-100 text-orange-700',
    animate: false,
  },
  error: {
    label: 'Error',
    color: 'bg-red-100 text-red-700',
    animate: false,
  },
};

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function StatusBadge({ status, elapsedSeconds }: StatusBadgeProps) {
  if (status === 'idle') return null;

  const { label, color, animate } = CONFIG[status];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${color}`}
    >
      {animate && (
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              status === 'queued' ? 'bg-amber-400' : 'bg-blue-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${
              status === 'queued' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
          />
        </span>
      )}
      {!animate && status === 'completed' && <span>✓</span>}
      {!animate && (status === 'failed' || status === 'error') && (
        <span>✗</span>
      )}
      {!animate && status === 'timeout' && <span>⏱</span>}
      <span>{label}</span>
      {elapsedSeconds > 0 && animate && (
        <span className="opacity-70">· {formatElapsed(elapsedSeconds)}</span>
      )}
    </div>
  );
}
