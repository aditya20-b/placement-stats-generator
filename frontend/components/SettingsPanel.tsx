'use client';

import { useState } from 'react';

interface SettingsPanelProps {
  onChange: (spreadsheetId: string | undefined) => void;
}

const SHEET_URL_RE =
  /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,60})/;

function extractSheetId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,60}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(SHEET_URL_RE);
  return match ? match[1] : null;
}

export function SettingsPanel({ onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  function handleChange(value: string) {
    setInput(value);
    if (!value.trim()) {
      setError('');
      onChange(undefined);
      return;
    }
    const id = extractSheetId(value);
    if (!id) {
      setError('Paste a Google Sheets URL or a valid spreadsheet ID');
      onChange(undefined);
    } else {
      setError('');
      onChange(id);
    }
  }

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '16px',
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-2)',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
          fontWeight: '450',
          padding: '0',
          transition: 'color 0.15s',
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M5 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Advanced settings
        {input.trim() && !error && (
          <span
            style={{
              marginLeft: '4px',
              padding: '1px 7px',
              borderRadius: '20px',
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: '500',
            }}
          >
            custom sheet
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            marginTop: '14px',
            padding: '16px',
            background: 'var(--bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}
          className="animate-fade-up"
        >
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
              marginBottom: '8px',
            }}
          >
            Custom Spreadsheet
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Paste Google Sheets URL or spreadsheet ID"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: `1.5px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              if (!error) (e.target as HTMLInputElement).style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              if (!error) (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
            }}
          />
          {error && (
            <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--danger)' }}>
              {error}
            </p>
          )}
          {!error && input.trim() && (
            <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--success)' }}>
              ✓ Using: {extractSheetId(input)}
            </p>
          )}
          {!input.trim() && (
            <p style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-3)' }}>
              Leave blank to use the default sheet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
