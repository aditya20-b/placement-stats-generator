'use client';

import { useState } from 'react';
import { FLAG_DEFINITIONS } from '@/lib/constants';

interface FlagTogglesProps {
  onChange: (flags: string[]) => void;
}

const FLAG_ICONS: Record<string, string> = {
  '--sections':    '⊞',
  '--gender':      '◑',
  '--companies':   '◈',
  '--no-ctc':      '◻',
  '--no-timeline': '◻',
  '--ctc-brackets':'▦',
};

export function FlagToggles({ onChange }: FlagTogglesProps) {
  const reportFlags = FLAG_DEFINITIONS.filter((f) => f.group === 'additive');

  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(reportFlags.map((f) => [f.flag, f.defaultEnabled]))
  );

  function toggle(flag: string) {
    setEnabled((prev) => {
      const next = { ...prev, [flag]: !prev[flag] };
      onChange(Object.entries(next).filter(([, v]) => v).map(([k]) => k));
      return next;
    });
  }

  return (
    <div>
      <p
        style={{
          fontSize: '11px',
          fontWeight: '600',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-3)',
          marginBottom: '10px',
        }}
      >
        Report Sections
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        {reportFlags.map((f) => {
          const active = enabled[f.flag];
          return (
            <button
              key={f.flag}
              onClick={() => toggle(f.flag)}
              title={f.description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-bg)' : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                fontSize: '13px',
                fontWeight: active ? '500' : '400',
                fontFamily: 'var(--font-body)',
              }}
            >
              {/* Checkbox */}
              <span
                style={{
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
                }}
              >
                {active && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span style={{ lineHeight: '1.2' }}>{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
