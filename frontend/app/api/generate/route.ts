import { NextRequest, NextResponse } from 'next/server';
import { triggerWorkflow } from '@/lib/github';
import { FLAG_MAP } from '@/lib/constants';

const SHEET_ID_RE = /^[a-zA-Z0-9_-]{10,60}$/;

export async function POST(request: NextRequest) {
  let body: { flags?: unknown; spreadsheetId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { flags, spreadsheetId } = body;

  if (!Array.isArray(flags) || !flags.every((f) => typeof f === 'string')) {
    return NextResponse.json(
      { error: 'flags must be an array of strings' },
      { status: 400 }
    );
  }

  for (const flag of flags) {
    if (!FLAG_MAP.has(flag)) {
      return NextResponse.json(
        { error: `Unknown flag: ${flag}` },
        { status: 400 }
      );
    }
  }

  if (spreadsheetId !== undefined && spreadsheetId !== null) {
    if (typeof spreadsheetId !== 'string' || !SHEET_ID_RE.test(spreadsheetId)) {
      return NextResponse.json(
        { error: 'Invalid spreadsheetId format' },
        { status: 400 }
      );
    }
  }

  try {
    const runId = await triggerWorkflow(
      flags as string[],
      spreadsheetId as string | undefined
    );
    return NextResponse.json({ runId }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
