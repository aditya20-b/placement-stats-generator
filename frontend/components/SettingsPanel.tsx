'use client';

import { useState } from 'react';

interface SettingsPanelProps {
  onChange: (spreadsheetId: string | undefined) => void;
}

const SHEET_URL_RE =
  /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,60})/;

function extractSheetId(input: string): string | null {
  const trimmed = input.trim();
  // Direct ID (no slashes)
  if (/^[a-zA-Z0-9_-]{10,60}$/.test(trimmed)) return trimmed;
  // Full URL
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
    <div className="rounded-lg border border-zinc-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        onClick={() => setOpen((o) => !o)}
      >
        <span>Advanced Settings</span>
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-zinc-200 px-4 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-1">
              Custom Spreadsheet
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Paste Google Sheets URL or spreadsheet ID"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            {!error && input.trim() && (
              <p className="mt-1 text-xs text-green-600">
                Using sheet: {extractSheetId(input)}
              </p>
            )}
            {!input.trim() && (
              <p className="mt-1 text-xs text-zinc-400">
                Leave blank to use the default sheet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
