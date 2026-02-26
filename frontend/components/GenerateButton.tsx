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
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M8 1v14M1 8l7-7 7 7" />
      </svg>
      Generate Report
    </button>
  );
}
