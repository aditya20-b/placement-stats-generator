'use client';

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
  async function handleClick() {
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
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: disabled
          ? 'var(--border)'
          : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        color: disabled ? 'var(--text-3)' : 'white',
        fontSize: '13.5px',
        fontWeight: '600',
        fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 1px 3px rgba(29,78,216,0.4), 0 0 0 1px rgba(29,78,216,0.2)',
        transition: 'all 0.15s',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 4px 12px rgba(29,78,216,0.4), 0 0 0 1px rgba(29,78,216,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow =
            '0 1px 3px rgba(29,78,216,0.4), 0 0 0 1px rgba(29,78,216,0.2)';
        }
      }}
    >
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
    </button>
  );
}
