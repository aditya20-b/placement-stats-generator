/**
 * pdfkit-charts-report.ts
 *
 * Same layout as pdf-generator.ts / index.ts, but every chart image is
 * replaced with a native PDFKit vector draw call from pdfkit-vector-charts.ts.
 *
 * Run:
 *   npx tsx src/pdfkit-charts-report.ts [same flags as normal CLI]
 *
 * Output: output/placement-report-vector.pdf
 *
 * Nothing in the existing codebase is modified.
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import ora from 'ora';

import { fetchCsv } from './fetcher.js';
import { parseMasterSheet, parseOfferDetails } from './parser.js';
import { computeStats, computeCtcStats } from './processor.js';
import {
  getMasterCsvUrl, getOfferDetailsCsvUrl,
  OUTPUT_DIR, INSTITUTION, REPORT_TITLE,
  MERGED_BRANCH_ORDER, BRANCH_ORDER,
} from './config.js';
import type { PlacementStats, CtcStats, ReportOptions } from './types.js';
import { DEFAULT_OPTIONS } from './types.js';

import {
  drawPieChart,
  drawBranchBar,
  drawClassStackedBar,
  drawGenderGroupedBar,
  drawOfferTypeBar,
  drawCtcBracketsBar,
  drawTimelineBar,
  drawTopRecruitersHBar,
  drawBranchCtcBar,
  type BranchCtcRow,
} from './pdfkit-vector-charts.js';
import type { StudentRecord, OfferRecord } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH  = path.join(__dirname, '..', 'assets', 'snu-logo.png');
const LOGO_RATIO = 859 / 290;
const SHOW_LOGO  = true;

// ─── Palette (identical to pdf-generator.ts) ─────────────────────────────────
const NAVY   = '#1E3A5F';
const BLUE   = '#2563EB';
const TEAL   = '#0891B2';
const WHITE  = '#FFFFFF';
const LGRAY  = '#F3F4F6';
const GRAY   = '#6B7280';
const BLACK  = '#111827';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const PURPLE = '#7C3AED';
const ORANGE = '#EA580C';

const PAGE_W    = 595.28;
const PAGE_H    = 841.89;
const MARGIN    = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Shared utilities (verbatim copies from pdf-generator.ts) ─────────────────

function fmt(n: number) { return String(n); }
function pct(n: number) { return `${n}%`; }

function formatInr(n: number): string {
  if (n >= 1_00_00_000) return `Rs. ${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `Rs. ${(n / 1_00_000).toFixed(2)} L`;
  return `Rs. ${n.toLocaleString('en-IN')}`;
}

type Doc = PDFKit.PDFDocument;

function chartTitle(doc: Doc, text: string, y: number) {
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
     .text(text, MARGIN, y, { width: CONTENT_W });
}

function drawPageHeader(doc: Doc, sectionTitle: string) {
  doc.rect(0, 0, PAGE_W, 64).fill(NAVY);

  const logoExists = SHOW_LOGO && fs.existsSync(LOGO_PATH);
  if (logoExists) {
    const logoH = 36;
    const logoW = Math.round(logoH * LOGO_RATIO);
    doc.image(LOGO_PATH, MARGIN, (64 - logoH) / 2, { width: logoW, height: logoH });
  }

  const secLogoW = logoExists ? Math.round(36 * LOGO_RATIO) : 0;
  const secTextX = logoExists ? MARGIN + secLogoW + 16 : MARGIN;
  const secTextW = PAGE_W - secTextX - MARGIN;

  doc.fillColor('#93C5FD').font('Helvetica-Bold').fontSize(13)
     .text(sectionTitle, secTextX, 24, { width: secTextW, align: 'center' });
}

function drawFooter(doc: Doc, pageNum: number) {
  const fy = PAGE_H - 28;
  doc.rect(0, fy - 6, PAGE_W, 34).fill('#F8FAFC');
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text(INSTITUTION, MARGIN, fy, { width: CONTENT_W / 2, align: 'left' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text(`Page ${pageNum}`, MARGIN, fy, { width: CONTENT_W, align: 'right' });
}

interface ColDef { header: string; width: number; align: 'left' | 'center' | 'right'; }
interface TableOpts { lastRowBold?: boolean; fontSize?: number; }

function drawTable(doc: Doc, cols: ColDef[], rows: string[][], startY: number, opts: TableOpts = {}): number {
  const { lastRowBold = false, fontSize = 9 } = opts;
  const rowH    = fontSize < 9 ? 16 : 18;
  const headerH = rowH + 2;
  const padX    = 5;
  const totalW  = cols.reduce((s, c) => s + c.width, 0);
  const tableX  = MARGIN + (CONTENT_W - totalW) / 2;
  let y = startY;

  const drawHeader = () => {
    doc.rect(tableX, y, totalW, headerH).fill(NAVY);
    let cx = tableX;
    for (const col of cols) {
      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(fontSize)
         .text(col.header, cx + padX, y + 4, { width: col.width - padX * 2, align: col.align, lineBreak: false });
      cx += col.width;
    }
    y += headerH;
  };

  drawHeader();

  for (let ri = 0; ri < rows.length; ri++) {
    const isLast = ri === rows.length - 1;
    const isBold = isLast && lastRowBold;

    if (y + rowH > PAGE_H - MARGIN - 30) {
      doc.addPage();
      drawPageHeader(doc, '');
      y = 70;
      drawHeader();
    }

    const bg = isBold ? '#DBEAFE' : (ri % 2 === 0 ? WHITE : LGRAY);
    doc.rect(tableX, y, totalW, rowH).fill(bg);

    let cx = tableX;
    for (let ci = 0; ci < cols.length; ci++) {
      const col  = cols[ci];
      const text = rows[ri][ci] ?? '';
      doc.fillColor(isBold ? NAVY : BLACK)
         .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(fontSize)
         .text(text, cx + padX, y + (rowH - fontSize) / 2, {
           width: col.width - padX * 2, align: col.align, lineBreak: false,
         });
      cx += col.width;
    }

    doc.moveTo(tableX, y + rowH).lineTo(tableX + totalW, y + rowH).stroke('#E5E7EB');
    y += rowH;
  }
  return y;
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 1 — Dashboard  (layout identical to pdf-generator.ts; charts are vectors)
// ═══════════════════════════════════════════════════════════════════════════
function drawPage1(doc: Doc, stats: PlacementStats, pageNum: number) {
  // ── Header bar ────────────────────────────────────────────────────────────
  doc.rect(0, 0, PAGE_W, 90).fill(NAVY);

  const logoExists = SHOW_LOGO && fs.existsSync(LOGO_PATH);
  if (logoExists) {
    const logoH = 48;
    const logoW = Math.round(logoH * LOGO_RATIO);
    doc.image(LOGO_PATH, MARGIN, (90 - logoH) / 2, { width: logoW, height: logoH });
  }

  const logoW  = logoExists ? Math.round(48 * LOGO_RATIO) : 0;
  const textX  = logoExists ? MARGIN + logoW + 16 : MARGIN;
  const textW  = PAGE_W - textX - MARGIN;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(18)
     .text(REPORT_TITLE, textX, 26, { width: textW, align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor('#CBD5E1')
     .text(`Generated on ${dateStr}`, textX, 56, { width: textW, align: 'center' });

  let y = 106;

  // ── Summary cards (verbatim from pdf-generator.ts) ────────────────────────
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text('Summary Overview', MARGIN, y);
  y += 22;

  const cardDefs = [
    { label: 'Total Students',      value: fmt(stats.totalCount),              color: NAVY   },
    { label: 'Opted for Placement', value: fmt(stats.optPlacement),            color: BLUE   },
    { label: 'Placed',              value: fmt(stats.placed),                  color: GREEN  },
    { label: 'Placement %',         value: pct(stats.overallPlacementPercent), color: TEAL   },
    { label: 'Not Placed',          value: fmt(stats.notPlaced),               color: RED    },
    { label: 'Higher Studies',      value: fmt(stats.higherStudies),           color: PURPLE },
    { label: 'Total Offers',        value: fmt(stats.totalOffers),             color: ORANGE },
    { label: 'Companies',           value: fmt(stats.totalCompanies),          color: GRAY   },
  ];

  const cols  = 4;
  const cardW = (CONTENT_W - (cols - 1) * 8) / cols;
  const cardH = 62;
  const gapX  = 8;
  const gapY  = 8;

  for (let i = 0; i < cardDefs.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx  = MARGIN + col * (cardW + gapX);
    const cy  = y + row * (cardH + gapY);
    const cd  = cardDefs[i];
    doc.roundedRect(cx, cy, cardW, cardH, 6).fill(cd.color);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
       .text(cd.value, cx + 8, cy + 9, { width: cardW - 16, align: 'center' });
    doc.fillColor('rgba(255,255,255,0.85)').font('Helvetica').fontSize(9)
       .text(cd.label, cx + 8, cy + 38, { width: cardW - 16, align: 'center' });
  }

  y += 2 * (cardH + gapY) + 10;

  // ── Pie chart — VECTOR ────────────────────────────────────────────────────
  const hold    = stats.branches.reduce((s, b) => s + b.hold,    0);
  const dropped = stats.branches.reduce((s, b) => s + b.dropped, 0);

  chartTitle(doc, 'Placement Status Distribution', y);
  y += 20;

  // Pie includes Higher Studies so all 316 students are represented.
  // The Placed slice shows its % of total with a "(of opted)" sublabel so
  // readers understand it aligns with the 77.1% headline card.
  const pieH = 260;
  drawPieChart(
    doc,
    [
      { label: 'Placed',         value: stats.placed,        color: GREEN  },
      { label: 'Not Placed',     value: stats.notPlaced,     color: RED    },
      { label: 'Higher Studies', value: stats.higherStudies, color: BLUE   },
      { label: 'Hold',           value: hold,                color: ORANGE },
      { label: 'Dropped',        value: dropped,             color: GRAY   },
    ].filter(s => s.value > 0),
    MARGIN, y, CONTENT_W, pieH,
  );
  y += pieH + 10;

  // ── Legend strip ──────────────────────────────────────────────────────────
  const legendItems = [
    { label: 'Placed',         value: stats.placed,        color: GREEN  },
    { label: 'Not Placed',     value: stats.notPlaced,     color: RED    },
    { label: 'Higher Studies', value: stats.higherStudies, color: BLUE   },
    { label: 'Hold',           value: hold,                color: ORANGE },
    { label: 'Dropped',        value: dropped,             color: GRAY   },
  ].filter(li => li.value > 0);
  const legColW = CONTENT_W / legendItems.length;
  for (let i = 0; i < legendItems.length; i++) {
    const lx = MARGIN + i * legColW;
    const li = legendItems[i];
    doc.roundedRect(lx + 4, y, legColW - 8, 28, 4).fill(li.color);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(11)
       .text(`${li.value}`, lx + 4, y + 3, { width: legColW - 8, align: 'center' });
    doc.fillColor(WHITE).font('Helvetica').fontSize(7.5)
       .text(li.label, lx + 4, y + 17, { width: legColW - 8, align: 'center' });
  }

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 2 — Branch Analysis
// ═══════════════════════════════════════════════════════════════════════════
function computeBranchCtc(
  records: StudentRecord[],
  offerRecords: OfferRecord[],
  useSections: boolean,
): BranchCtcRow[] {
  // Build rollNo → merged-branch map (only placement offers, not internships)
  const rollToBranch = new Map<string, string>();
  for (const r of records) {
    rollToBranch.set(r.rollNo, useSections ? `${r.cls.trim()} ${r.section.trim()}`.trim() : r.cls.trim());
  }

  // Collect CTC values per branch (exclude internship stipends)
  const branchCtcs = new Map<string, number[]>();
  for (const o of offerRecords) {
    if (o.offerType === 'Internship') continue;
    const branch = rollToBranch.get(o.rollNo);
    if (!branch) continue;
    if (!branchCtcs.has(branch)) branchCtcs.set(branch, []);
    branchCtcs.get(branch)!.push(o.ctc);
  }

  const order = useSections ? BRANCH_ORDER : MERGED_BRANCH_ORDER;

  return order
    .filter(label => branchCtcs.has(label))
    .map(label => {
      const ctcs   = branchCtcs.get(label)!.filter(c => c > 0).sort((a, b) => a - b);
      const n      = ctcs.length;
      const avg    = n > 0 ? Math.round(ctcs.reduce((s, c) => s + c, 0) / n) : 0;
      const median = n > 0
        ? (n % 2 === 0 ? Math.round((ctcs[n / 2 - 1] + ctcs[n / 2]) / 2) : ctcs[Math.floor(n / 2)])
        : 0;
      return { label, avgCtc: avg, medianCtc: median };
    });
}

function drawPage2(doc: Doc, stats: PlacementStats, opts: ReportOptions, records: StudentRecord[], offerRecords: OfferRecord[], pageNum: number) {
  drawPageHeader(doc, 'Branch-wise Analysis');
  let y = 80;

  const showSections = opts.showSections;
  const branchData   = showSections ? stats.branches : stats.mergedBranches;

  // ── Branch bar — VECTOR ───────────────────────────────────────────────────
  chartTitle(doc, showSections ? 'Section-wise Placement Percentage' : 'Branch-wise Placement Percentage', y);
  y += 20;
  const barChartH = branchData.length * 52 + 30;
  drawBranchBar(doc, stats, MARGIN, y, CONTENT_W, barChartH, showSections);
  y += barChartH + 12;

  // ── Branch table (verbatim from pdf-generator.ts) ─────────────────────────
  const branchCols: ColDef[] = [
    { header: showSections ? 'Section' : 'Branch', width: showSections ? 90 : 80, align: 'left'   },
    { header: 'Total',       width: 60,  align: 'center' },
    { header: 'Opted',       width: 60,  align: 'center' },
    { header: 'Placed',      width: 65,  align: 'center' },
    { header: 'Not Placed',  width: 75,  align: 'center' },
    { header: 'Higher Std.', width: 75,  align: 'center' },
    { header: 'Placed %',    width: 65,  align: 'center' },
    { header: 'Offers',      width: 55,  align: 'center' },
  ];

  const branchRows = branchData.map(b => [
    b.label, String(b.totalStudents), String(b.optPlacement),
    String(b.placed), String(b.notPlaced), String(b.higherStudies),
    pct(b.placementPercent), String(b.totalOffers),
  ]);
  const totalOffer = branchData.reduce((s, b) => s + b.totalOffers, 0);
  branchRows.push([
    'Total', String(stats.totalCount), String(stats.optPlacement),
    String(stats.placed), String(stats.notPlaced), String(stats.higherStudies),
    pct(stats.overallPlacementPercent), String(totalOffer),
  ]);

  y = drawTable(doc, branchCols, branchRows, y, { lastRowBold: true });
  y += 16;

  // ── Optional: gender chart ────────────────────────────────────────────────
  if (opts.showGender) {
    const spaceLeft = PAGE_H - MARGIN - y - 35;
    if (spaceLeft > 160) {
      chartTitle(doc, 'Gender-wise Placement Percentage by Branch', y);
      y += 20;
      const gh = Math.min(spaceLeft - 20, 200);
      drawGenderGroupedBar(doc, branchData, MARGIN, y, CONTENT_W, gh, showSections);
      y += gh + 10;
    }
  }

  // ── Optional: class-wise stacked status chart ─────────────────────────────
  if (opts.showClassStatus) {
    const spaceLeft = PAGE_H - MARGIN - y - 35;
    if (spaceLeft < 120) {
      doc.addPage();
      drawPageHeader(doc, 'Branch-wise Analysis (cont.)');
      y = 80;
    }
    chartTitle(doc, 'Class-wise Student Status Overview', y);
    y += 20;
    const sh = Math.min(PAGE_H - MARGIN - y - 35, 200);
    drawClassStackedBar(doc, branchData, MARGIN, y, CONTENT_W, sh);
    y += sh + 10;
  }

  // ── Average / Median CTC per branch — always shown ────────────────────────
  const branchCtcData = computeBranchCtc(records, offerRecords, showSections);
  if (branchCtcData.length > 0) {
    const ctcChartH = 220;
    const spaceForCtc = PAGE_H - MARGIN - y - 35;
    if (spaceForCtc < ctcChartH + 30) {
      doc.addPage();
      drawPageHeader(doc, 'Branch-wise Analysis (cont.)');
      y = 80;
    }
    chartTitle(doc, 'Average & Median CTC by Branch (placement offers only)', y);
    y += 20;
    drawBranchCtcBar(doc, branchCtcData, MARGIN, y, CONTENT_W, ctcChartH);
  }

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3 — CTC & Offer Type Analysis
// ═══════════════════════════════════════════════════════════════════════════
function drawPage3(doc: Doc, _stats: PlacementStats, ctcStats: CtcStats, opts: ReportOptions, pageNum: number) {
  drawPageHeader(doc, 'CTC & Offer Type Analysis');
  let y = 80;

  // ── CTC cards (verbatim from pdf-generator.ts) ────────────────────────────
  chartTitle(doc, 'CTC Overview  (placement offers only)', y);
  y += 20;

  const ctcCards = [
    { label: 'Total Placement Offers', value: String(ctcStats.count),      color: NAVY  },
    { label: 'Highest CTC',            value: formatInr(ctcStats.highest), color: GREEN },
    { label: 'Average CTC',            value: formatInr(ctcStats.average), color: TEAL  },
    { label: 'Median CTC',             value: formatInr(ctcStats.median),  color: BLUE  },
    { label: 'Lowest CTC',             value: formatInr(ctcStats.lowest),  color: RED   },
  ];
  const ctcCardW = (CONTENT_W - 4 * 8) / 5;
  for (let i = 0; i < ctcCards.length; i++) {
    const cx = MARGIN + i * (ctcCardW + 8);
    const cd = ctcCards[i];
    doc.roundedRect(cx, y, ctcCardW, 62, 6).fill(cd.color);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
       .text(cd.value, cx + 4, y + 11, { width: ctcCardW - 8, align: 'center' });
    doc.fillColor(WHITE).font('Helvetica').fontSize(8)
       .text(cd.label, cx + 4, y + 38, { width: ctcCardW - 8, align: 'center' });
  }
  y += 76;

  // ── Offer type bar — VECTOR ────────────────────────────────────────────────
  chartTitle(doc, 'Offer Type Distribution', y);
  y += 20;
  const offerChartH = 190;
  drawOfferTypeBar(doc, ctcStats, MARGIN, y, CONTENT_W, offerChartH);
  y += offerChartH + 10;

  // ── Offer type table (verbatim from pdf-generator.ts) ─────────────────────
  const allOffers = Object.values(ctcStats.offerTypeBreakdown).reduce((s, v) => s + v, 0);
  const OFFER_BANDS: Record<string, string> = {
    'Internship': 'Stipend', 'Regular': '0 – 6 LPA', 'Dream': '6 – 10 LPA',
    'Super Dream': '10 – 20 LPA', 'Marquee': '20+ LPA',
  };
  const otCols: ColDef[] = [
    { header: 'Offer Type',  width: 110, align: 'left'   },
    { header: 'CTC Band',    width: 110, align: 'left'   },
    { header: 'Count',       width: 70,  align: 'center' },
    { header: '% of Offers', width: 90,  align: 'center' },
  ];
  const otRows = (['Internship', 'Regular', 'Dream', 'Super Dream', 'Marquee'] as const).map(t => [
    t,
    OFFER_BANDS[t],
    String(ctcStats.offerTypeBreakdown[t] ?? 0),
    `${allOffers > 0 ? ((ctcStats.offerTypeBreakdown[t] ?? 0) / allOffers * 100).toFixed(1) : 0}%`,
  ]);
  otRows.push(['Total', '', String(allOffers), '100%']);
  y = drawTable(doc, otCols, otRows, y, { lastRowBold: true, fontSize: 9 });
  y += 18;

  // ── CTC brackets — VECTOR (optional) ──────────────────────────────────────
  if (opts.showCtcBrackets) {
    const remainH = PAGE_H - MARGIN - y - 35;
    if (remainH < 180) {
      doc.addPage(); drawPageHeader(doc, 'CTC & Offer Type Analysis (cont.)'); y = 80;
    }
    chartTitle(doc, 'CTC Bracket Distribution (placement offers only)', y);
    y += 20;
    drawCtcBracketsBar(doc, ctcStats, MARGIN, y, CONTENT_W, 180);
    y += 190;
  }

  // ── Timeline — VECTOR (optional) ──────────────────────────────────────────
  if (opts.showTimeline) {
    const remainH = PAGE_H - MARGIN - y - 35;
    if (remainH < 180) {
      doc.addPage(); drawPageHeader(doc, 'CTC & Offer Type Analysis (cont.)'); y = 80;
    }
    chartTitle(doc, 'Month-by-month Offer Activity', y);
    y += 20;
    const timelineH = Math.min(PAGE_H - MARGIN - y - 35, 190);
    drawTimelineBar(doc, ctcStats, MARGIN, y, CONTENT_W, timelineH);
  }

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4 — Company Analysis (optional)
// ═══════════════════════════════════════════════════════════════════════════
function drawPage4(doc: Doc, stats: PlacementStats, pageNum: number) {
  drawPageHeader(doc, 'Company-wise Analysis');
  let y = 80;

  // ── Top recruiters — VECTOR ────────────────────────────────────────────────
  chartTitle(doc, 'Top 10 Recruiters by Offer Count', y);
  y += 20;
  const topH = stats.topRecruiters.length * 30 + 30;
  drawTopRecruitersHBar(doc, stats, MARGIN, y, CONTENT_W, topH);
  y += topH + 16;

  // ── Company table (verbatim from pdf-generator.ts) ─────────────────────────
  const companyCols: ColDef[] = [
    { header: 'Company', width: 170, align: 'left'   },
    { header: 'Total',   width: 48,  align: 'center' },
    ...MERGED_BRANCH_ORDER.map(b => ({ header: b, width: 90, align: 'center' as const })),
  ];
  const companyRows = stats.companies.map(c => [
    c.name,
    String(c.totalOffers),
    ...MERGED_BRANCH_ORDER.map(b => { const n = c.branchWise[b] ?? 0; return n > 0 ? String(n) : '-'; }),
  ]);
  companyRows.push([
    'Total', String(stats.totalOffers),
    ...MERGED_BRANCH_ORDER.map(b => String(stats.mergedBranches.find(x => x.label === b)?.totalOffers ?? 0)),
  ]);
  drawTable(doc, companyCols, companyRows, y, { lastRowBold: true, fontSize: 8.5 });

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// PDF assembly
// ═══════════════════════════════════════════════════════════════════════════
export async function generateVectorPdf(
  stats: PlacementStats,
  ctcStats: CtcStats,
  records: StudentRecord[],
  offerRecords: OfferRecord[],
  outputPath: string,
  opts: ReportOptions = DEFAULT_OPTIONS,
): Promise<void> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: { Title: `${INSTITUTION} - ${REPORT_TITLE}`, Author: INSTITUTION, CreationDate: new Date() },
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  let pageNum = 1;
  drawPage1(doc, stats, pageNum++);

  doc.addPage();
  drawPage2(doc, stats, opts, records, offerRecords, pageNum++);

  if (opts.showCtc) {
    doc.addPage();
    drawPage3(doc, stats, ctcStats, opts, pageNum++);
  }

  if (opts.showCompanies) {
    doc.addPage();
    drawPage4(doc, stats, pageNum++);
  }

  doc.end();
  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI — only runs when this file is the direct entry point
// ═══════════════════════════════════════════════════════════════════════════
const _isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (_isMain) {
const program = new Command();

program
  .name('placement-stats-vector')
  .description('Placement report with native PDFKit vector charts (no Chart.js)')
  .version('1.0.0')
  .option('-o, --output <path>', 'Output PDF path', path.join(OUTPUT_DIR, 'placement-report-vector.pdf'))
  .option('--sections',       'Show individual section breakdown (AIDS A/B, IOT A/B)')
  .option('--gender',         'Include gender-wise breakdown chart')
  .option('--class-status',   'Include class-wise stacked student status chart')
  .option('--companies',      'Include company-wise breakdown page')
  .option('--no-ctc',         'Hide CTC & offer type page')
  .option('--no-timeline',    'Hide month-by-month timeline')
  .option('--ctc-brackets',   'Show CTC bracket distribution chart')
  .option('--spreadsheet-id <id>', 'Override Google Sheets spreadsheet ID')
  .action(async (opts) => {
    if (opts.spreadsheetId) process.env.SPREADSHEET_ID = opts.spreadsheetId;

    const outputPath = opts.output;
    const reportOpts: ReportOptions = {
      showSections:    !!opts.sections,
      showGender:      !!opts.gender,
      showClassStatus: !!opts.classStatus,
      showCompanies:   !!opts.companies,
      showCtc:         opts.ctc !== false,
      showTimeline:    opts.timeline !== false,
      showCtcBrackets: !!opts.ctcBrackets,
    };

    console.log('');
    const spinner = ora({ color: 'blue' });

    try {
      spinner.start('Fetching data from Google Sheets…');
      const [masterCsv, offerCsv] = await Promise.all([
        fetchCsv(getMasterCsvUrl()),
        fetchCsv(getOfferDetailsCsvUrl()),
      ]);
      spinner.succeed(`Data fetched — Master: ${(masterCsv.length / 1024).toFixed(1)} KB, Offers: ${(offerCsv.length / 1024).toFixed(1)} KB`);

      spinner.start('Parsing records…');
      const records      = parseMasterSheet(masterCsv);
      const offerRecords = parseOfferDetails(offerCsv);
      spinner.succeed(`Parsed ${records.length} students, ${offerRecords.length} offer records`);

      spinner.start('Computing placement statistics…');
      const stats    = computeStats(records);
      const ctcStats = computeCtcStats(offerRecords);
      spinner.succeed(`Stats computed — ${stats.placed}/${stats.optPlacement} placed (${stats.overallPlacementPercent}%)`);

      spinner.start('Rendering vector PDF report…');
      await generateVectorPdf(stats, ctcStats, records, offerRecords, outputPath, reportOpts);
      spinner.succeed(`PDF saved → ${path.resolve(outputPath)}`);

      console.log('');
      console.log('✅ Vector report generated!');
      console.log(`   📄 ${path.resolve(outputPath)}`);
      console.log('');
    } catch (err) {
      spinner.fail('Failed');
      console.error('\n❌ Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
} // end isMain
