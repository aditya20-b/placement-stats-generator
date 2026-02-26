'use client';

import type { WorkflowStatus } from '@/hooks/useWorkflowPoller';

interface StatusBadgeProps {
  status: WorkflowStatus;
  elapsedSeconds: number;
}

const CONFIG: Record<
  WorkflowStatus,
  { label: string; bg: string; color: string; dot?: string }
> = {
  idle:        { label: 'Idle',       bg: 'transparent',          color: 'var(--text-3)',  },
  queued:      { label: 'Queued',     bg: 'var(--warning-bg)',     color: 'var(--warning)', dot: '#F59E0B' },
  in_progress: { label: 'Running',    bg: 'var(--accent-bg)',      color: 'var(--accent)',  dot: '#3B82F6' },
  completed:   { label: 'Done',       bg: 'var(--success-bg)',     color: 'var(--success)'  },
  failed:      { label: 'Failed',     bg: 'var(--danger-bg)',      color: 'var(--danger)'   },
  timeout:     { label: 'Timed out',  bg: 'var(--warning-bg)',     color: 'var(--warning)'  },
  error:       { label: 'Error',      bg: 'var(--danger-bg)',      color: 'var(--danger)'   },
};

function fmt(s: number) {
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function StatusBadge({ status, elapsedSeconds }: StatusBadgeProps) {
  if (status === 'idle') return null;

  const { label, bg, color, dot } = CONFIG[status];
  const pulsing = !!dot;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        padding: '5px 11px 5px 9px',
        borderRadius: '20px',
        background: bg,
        color,
        fontSize: '12.5px',
        fontWeight: '500',
        letterSpacing: '0.01em',
      }}
      className="animate-fade-up"
    >
      {pulsing ? (
        <span style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: dot,
              animation: 'pulse-ring 1.4s ease-out infinite',
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: dot,
            }}
          />
        </span>
      ) : status === 'completed' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="5"/>
          <path d="M3.5 6l2 2 3-3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="5"/>
          <path d="M6 4v2l1.5 1.5" strokeLinecap="round"/>
        </svg>
      )}
      <span>{label}</span>
      {pulsing && elapsedSeconds > 0 && (
        <span style={{ opacity: 0.65 }}>· {fmt(elapsedSeconds)}</span>
      )}
    </span>
  );
}
