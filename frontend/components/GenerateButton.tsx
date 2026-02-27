'use client';

import { useState } from 'react';

interface GenerateButtonProps {
  flags: string[];
  spreadsheetId: string | undefined;
  onRunId: (runId: number) => void;
  disabled?: boolean;
}

export function GenerateButton({
  flags,
  spreadsheetId,
  onRunId,
  disabled,
}: GenerateButtonProps) {
  const [loading, setLoading] = useState(false);

  const isDisabled = disabled || loading;

  async function handleClick() {
    if (isDisabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags, spreadsheetId }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Failed to trigger report: ${data.error ?? res.status}`);
        return;
      }

      const { runId } = (await res.json()) as { runId: number };
      onRunId(runId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: isDisabled
          ? 'var(--border)'
          : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        color: isDisabled ? 'var(--text-3)' : 'white',
        fontSize: '13.5px',
        fontWeight: '600',
        fontFamily: 'var(--font-body)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        boxShadow: isDisabled ? 'none' : '0 1px 3px rgba(29,78,216,0.4), 0 0 0 1px rgba(29,78,216,0.2)',
        transition: 'all 0.15s',
        letterSpacing: '0.01em',
        minWidth: '160px',
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 12px rgba(29,78,216,0.4), 0 0 0 1px rgba(29,78,216,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 1px 3px rgba(29,78,216,0.4), 0 0 0 1px rgba(29,78,216,0.2)';
        }
      }}
    >
      {loading ? (
        <>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ animation: 'spin 0.8s linear infinite' }}
          >
            <circle cx="6.5" cy="6.5" r="5" strokeOpacity="0.3" />
            <path d="M6.5 1.5a5 5 0 0 1 5 5" />
          </svg>
          Triggering…
        </>
      ) : (
        <>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 1v11M2 5l4.5-4 4.5 4" />
          </svg>
          Generate Report
        </>
      )}
    </button>
  );
}
