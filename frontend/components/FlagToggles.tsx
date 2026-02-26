'use client';

import { useState } from 'react';
import { FLAG_DEFINITIONS } from '@/lib/constants';

interface FlagTogglesProps {
  onChange: (flags: string[]) => void;
}

export function FlagToggles({ onChange }: FlagTogglesProps) {
  const reportFlags = FLAG_DEFINITIONS.filter((f) => f.group === 'report');

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
      <h3 className="text-sm font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
        Report Options
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {reportFlags.map((f) => (
          <button
            key={f.flag}
            onClick={() => toggle(f.flag)}
            title={f.description}
            className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
              enabled[f.flag]
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                enabled[f.flag]
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-zinc-300'
              }`}
            >
              {enabled[f.flag] && (
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="font-medium">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
