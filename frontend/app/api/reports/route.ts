import { NextResponse } from 'next/server';
import { fetchReportsIndex } from '@/lib/reports';

export async function GET() {
  try {
    const reports = await fetchReportsIndex();
    return NextResponse.json(reports, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
