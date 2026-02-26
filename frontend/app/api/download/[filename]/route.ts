import { NextRequest, NextResponse } from 'next/server';
import { getPdfDownloadUrl } from '@/lib/reports';

const FILENAME_RE = /^placement-report-\d{8}-\d{6}\.pdf$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!FILENAME_RE.test(filename)) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  const url = getPdfDownloadUrl(filename);
  const upstream = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_PAT!}`,
    },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Upstream fetch failed: ${upstream.status}` },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
