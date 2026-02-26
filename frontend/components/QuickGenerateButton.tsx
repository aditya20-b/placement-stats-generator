'use client';

import { useState } from 'react';

interface QuickGenerateButtonProps {
  flags: string[];
  spreadsheetId?: string;
}

export function QuickGenerateButton({ flags, spreadsheetId }: QuickGenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate-quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags, spreadsheetId }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? `Request failed (${res.status})`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'placement-report-quick.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: loading
            ? 'var(--border)'
            : 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
          color: loading ? 'var(--text-3)' : 'white',
          fontSize: '13.5px',
          fontWeight: '600',
          fontFamily: 'var(--font-body)',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 1px 3px rgba(14,116,144,0.4), 0 0 0 1px rgba(14,116,144,0.2)',
          transition: 'all 0.15s',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 4px 12px rgba(14,116,144,0.4), 0 0 0 1px rgba(14,116,144,0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow =
              '0 1px 3px rgba(14,116,144,0.4), 0 0 0 1px rgba(14,116,144,0.2)';
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
              <path d="M6.5 1.5 A5 5 0 0 1 11.5 6.5" />
            </svg>
            Generating…
          </>
        ) : (
          <>
            <span style={{ fontSize: '14px' }}>⚡</span>
            Quick Generate
          </>
        )}
      </button>
      {error && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(220,38,38,0.15)',
            fontSize: '12px',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
