import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowRunStatus } from '@/lib/github';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const id = parseInt(runId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid run ID' }, { status: 400 });
  }

  try {
    const { status, conclusion } = await getWorkflowRunStatus(id);
    return NextResponse.json({ status, conclusion });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
