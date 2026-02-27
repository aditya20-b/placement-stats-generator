'use client';

import { useState } from 'react';
import { FLAG_DEFINITIONS } from '@/lib/constants';

interface SettingsPanelProps {
  onChange: (spreadsheetId: string | undefined) => void;
  onFlagsChange: (flags: string[]) => void;
}

const SHEET_URL_RE =
  /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,60})/;

function extractSheetId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,60}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(SHEET_URL_RE);
  return match ? match[1] : null;
}

const advancedFlags = FLAG_DEFINITIONS.filter((f) => f.group === 'advanced');

export function SettingsPanel({ onChange, onFlagsChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(advancedFlags.map((f) => [f.flag, f.defaultEnabled]))
  );

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

  function toggleFlag(flag: string) {
    setEnabled((prev) => {
      const next = { ...prev, [flag]: !prev[flag] };
      onFlagsChange(Object.entries(next).filter(([, v]) => v).map(([k]) => k));
      return next;
    });
  }

  const hasAdvancedActive = advancedFlags.some((f) => enabled[f.flag]);

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
        {(hasAdvancedActive || (input.trim() && !error)) && (
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
            {hasAdvancedActive && input.trim() && !error
              ? 'custom sheet + flags'
              : input.trim() && !error
              ? 'custom sheet'
              : 'flags active'}
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
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
          className="animate-fade-up"
        >
          {/* Advanced flag toggles */}
          <div>
            <p
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
                marginBottom: '10px',
              }}
            >
              Output Options
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {advancedFlags.map((f) => {
                const active = enabled[f.flag];
                return (
                  <label
                    key={f.flag}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      onClick={() => toggleFlag(f.flag)}
                      style={{
                        marginTop: '1px',
                        width: '15px',
                        height: '15px',
                        borderRadius: '3px',
                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: active ? 'var(--accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                        cursor: 'pointer',
                      }}
                    >
                      {active && (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span onClick={() => toggleFlag(f.flag)} style={{ userSelect: 'none' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: active ? '500' : '400' }}>
                        {f.label}
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginTop: '1px' }}>
                        {f.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom spreadsheet */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
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
                boxSizing: 'border-box',
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
        </div>
      )}
    </div>
  );
}
