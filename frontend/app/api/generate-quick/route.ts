import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fetchCsv } from '@/src/fetcher';
import { parseMasterSheet, parseOfferDetails } from '@/src/parser';
import { computeStats, computeCtcStats } from '@/src/processor';
import { generatePdf } from '@/src/pdf-generator';
import type { ReportOptions } from '@/src/types';
import { getMasterCsvUrl, getOfferDetailsCsvUrl } from '@/src/config';

export const runtime = 'nodejs';

const VALID_FLAGS = new Set([
  '--sections',
  '--gender',
  '--companies',
  '--no-ctc',
  '--no-timeline',
  '--ctc-brackets',
]);

const SHEET_ID_RE = /^[a-zA-Z0-9_-]{10,60}$/;

function flagsToReportOptions(flags: string[]): ReportOptions {
  return {
    showSections:    flags.includes('--sections'),
    showGender:      flags.includes('--gender'),
    showCompanies:   flags.includes('--companies'),
    showCtc:         !flags.includes('--no-ctc'),
    showTimeline:    !flags.includes('--no-timeline'),
    showCtcBrackets: flags.includes('--ctc-brackets'),
  };
}

export async function POST(request: NextRequest) {
  let body: { flags?: unknown; spreadsheetId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { flags, spreadsheetId } = body;

  if (!Array.isArray(flags) || !flags.every((f) => typeof f === 'string')) {
    return NextResponse.json({ error: 'flags must be an array of strings' }, { status: 400 });
  }

  for (const flag of flags) {
    if (!VALID_FLAGS.has(flag)) {
      return NextResponse.json({ error: `Unknown flag: ${flag}` }, { status: 400 });
    }
  }

  if (spreadsheetId !== undefined && spreadsheetId !== null) {
    if (typeof spreadsheetId !== 'string' || !SHEET_ID_RE.test(spreadsheetId)) {
      return NextResponse.json({ error: 'Invalid spreadsheetId format' }, { status: 400 });
    }
  }

  if (spreadsheetId && typeof spreadsheetId === 'string') {
    process.env.SPREADSHEET_ID = spreadsheetId;
  }

  try {
    const [masterCsv, offerCsv] = await Promise.all([
      fetchCsv(getMasterCsvUrl()),
      fetchCsv(getOfferDetailsCsvUrl()),
    ]);

    const records      = parseMasterSheet(masterCsv);
    const offerRecords = parseOfferDetails(offerCsv);
    const stats        = computeStats(records);
    const ctcStats     = computeCtcStats(offerRecords);
    const reportOpts   = flagsToReportOptions(flags as string[]);

    const outputPath = path.join(os.tmpdir(), `placement-report-quick-${Date.now()}.pdf`);
    await generatePdf(stats, ctcStats, null, outputPath, reportOpts);

    const pdfBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=placement-report-quick.pdf',
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
