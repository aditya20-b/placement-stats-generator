import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { PlacementStats, CtcStats, ChartBuffers, ReportOptions } from './types';
import { DEFAULT_OPTIONS } from './types';
import { MERGED_BRANCH_ORDER, INSTITUTION, REPORT_TITLE } from './config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.png');
const SHOW_LOGO = false; // set to true once branding is finalised

// ─── Palette ────────────────────────────────────────────────────────────────
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

const PAGE_W = 595.28; // A4 width pts
const PAGE_H = 841.89; // A4 height pts
const MARGIN = 40;
const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number, suffix = '') {
  return `${n}${suffix}`;
}

function pct(n: number) {
  return `${n}%`;
}

// Use "Rs." instead of "₹" — Helvetica (built-in PDF font) doesn't carry the rupee glyph
function formatInr(n: number): string {
  if (n >= 1_00_00_000) return `Rs. ${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `Rs. ${(n / 1_00_000).toFixed(2)} L`;
  return `Rs. ${n.toLocaleString('en-IN')}`;
}

export async function generatePdf(
  stats: PlacementStats,
  ctcStats: CtcStats,
  charts: ChartBuffers | null,
  outputPath: string,
  opts: ReportOptions = DEFAULT_OPTIONS,
): Promise<void> {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    info: {
      Title: `${INSTITUTION} - ${REPORT_TITLE}`,
      Author: INSTITUTION,
      CreationDate: new Date(),
    },
  });

  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  let pageNum = 1;

  drawPage1(doc, stats, charts, pageNum++);
  doc.addPage();
  drawPage2(doc, stats, charts, opts, pageNum++);
  if (opts.showCtc) {
    doc.addPage();
    drawPage3(doc, stats, ctcStats, charts, opts, pageNum++);
  }
  if (opts.showCompanies) {
    doc.addPage();
    drawPage4(doc, stats, pageNum++, charts);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 1 — Dashboard
// ═══════════════════════════════════════════════════════════════════════════
function drawPage1(doc: PDFKit.PDFDocument, stats: PlacementStats, charts: ChartBuffers | null, pageNum: number) {
  let y = MARGIN;

  // ── Header bar ────────────────────────────────────────────────────────────
  doc.rect(0, 0, PAGE_W, 90).fill(NAVY);

  const logoExists = SHOW_LOGO && fs.existsSync(LOGO_PATH);
  if (logoExists) {
    const logoH = 48;
    const logoW = Math.round(logoH * (320 / 90));
    doc.image(LOGO_PATH, MARGIN, (90 - logoH) / 2, { width: logoW, height: logoH });
  }

  const textX = logoExists ? MARGIN + Math.round(48 * (320 / 90)) + 8 : MARGIN;
  const textW = PAGE_W - textX - MARGIN;

  doc.fillColor(WHITE)
     .font('Helvetica-Bold')
     .fontSize(18)
     .text(INSTITUTION, textX, 18, { width: textW, align: 'center' });

  doc.font('Helvetica')
     .fontSize(12)
     .fillColor('#93C5FD')
     .text(REPORT_TITLE, textX, 44, { width: textW, align: 'center' });

  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  doc.font('Helvetica')
     .fontSize(9)
     .fillColor('#CBD5E1')
     .text(`Generated on ${dateStr}`, textX, 66, { width: textW, align: 'center' });

  y = 106;

  // ── Section heading ───────────────────────────────────────────────────────
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13)
     .text('Summary Overview', MARGIN, y);
  y += 22;

  // ── Stat cards (2 rows × 4 cols) ──────────────────────────────────────────
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

  const cols = 4;
  const cardW = (CONTENT_W - (cols - 1) * 8) / cols;
  const cardH = 62;
  const gapX = 8;
  const gapY = 8;

  for (let i = 0; i < cardDefs.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = MARGIN + col * (cardW + gapX);
    const cy = y + row * (cardH + gapY);
    const cd = cardDefs[i];

    doc.roundedRect(cx, cy, cardW, cardH, 6).fill(cd.color);
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(22)
       .text(cd.value, cx + 8, cy + 9, { width: cardW - 16, align: 'center' });
    doc.fillColor('rgba(255,255,255,0.85)').font('Helvetica').fontSize(9)
       .text(cd.label, cx + 8, cy + 38, { width: cardW - 16, align: 'center' });
  }

  y += 2 * (cardH + gapY) + 10;

  // ── Pie chart ─────────────────────────────────────────────────────────────
  chartTitle(doc, 'Placement Status Distribution', y);
  y += 20;

  if (charts) {
    const chartW = 420;
    const chartH = 300;
    doc.image(charts.overallPie, (PAGE_W - chartW) / 2, y, { width: chartW, height: chartH });
    y += chartH + 10;
  } else {
    drawPlaceholder(doc, MARGIN, y, CONTENT_W, 200, 'Pie chart (run without --no-charts to enable)');
    y += 210;
  }

  // ── Legend strip ──────────────────────────────────────────────────────────
  const legendItems = [
    { label: 'Placed',         value: stats.placed,        color: GREEN  },
    { label: 'Not Placed',     value: stats.notPlaced,     color: RED    },
    { label: 'Higher Studies', value: stats.higherStudies, color: BLUE   },
  ];

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
function drawPage2(doc: PDFKit.PDFDocument, stats: PlacementStats, charts: ChartBuffers | null, opts: ReportOptions, pageNum: number) {
  drawPageHeader(doc, 'Branch-wise Analysis');
  let y = 80;

  // ── Branch placement % bar chart (sections or merged) ─────────────────────
  const showSections = opts.showSections;
  const chartImg   = showSections ? charts?.branchBarSections : charts?.branchBarMerged;
  const branchData = showSections ? stats.branches : stats.mergedBranches;

  chartTitle(doc, showSections ? 'Section-wise Placement Percentage' : 'Branch-wise Placement Percentage', y);
  y += 20;
  if (charts && chartImg) {
    doc.image(chartImg, MARGIN, y, { width: CONTENT_W, height: 220 });
    y += 228;
  } else {
    drawPlaceholder(doc, MARGIN, y, CONTENT_W, 200, 'Branch bar chart');
    y += 210;
  }

  // ── Branch table ───────────────────────────────────────────────────────────
  const branchCols = [
    { header: showSections ? 'Section' : 'Branch', width: showSections ? 90 : 80, align: 'left' as const },
    { header: 'Total',       width: 60,  align: 'center' as const },
    { header: 'Opted',       width: 60,  align: 'center' as const },
    { header: 'Placed',      width: 65,  align: 'center' as const },
    { header: 'Not Placed',  width: 75,  align: 'center' as const },
    { header: 'Higher Std.', width: 75,  align: 'center' as const },
    { header: 'Placed %',    width: 65,  align: 'center' as const },
    { header: 'Offers',      width: 55,  align: 'center' as const },
  ];

  const branchRows = branchData.map(b => [
    b.label,
    String(b.totalStudents),
    String(b.optPlacement),
    String(b.placed),
    String(b.notPlaced),
    String(b.higherStudies),
    pct(b.placementPercent),
    String(b.totalOffers),
  ]);

  const totalOffer = branchData.reduce((s, b) => s + b.totalOffers, 0);
  branchRows.push([
    'Total',
    String(stats.totalCount),
    String(stats.optPlacement),
    String(stats.placed),
    String(stats.notPlaced),
    String(stats.higherStudies),
    pct(stats.overallPlacementPercent),
    String(totalOffer),
  ]);

  y = drawTable(doc, branchCols, branchRows, y, { lastRowBold: true });
  y += 16;

  // ── Gender grouped bar (optional) ─────────────────────────────────────────
  if (opts.showGender) {
    const spaceForGender = PAGE_H - MARGIN - y - 35;
    if (spaceForGender > 160) {
      chartTitle(doc, 'Gender-wise Placement Percentage by Branch', y);
      y += 20;
      if (charts) {
        doc.image(charts.genderGroupedBar, MARGIN, y, { width: CONTENT_W, height: Math.min(spaceForGender - 20, 220) });
      } else {
        drawPlaceholder(doc, MARGIN, y, CONTENT_W, 180, 'Gender grouped bar chart');
      }
    } else {
      chartTitle(doc, 'Gender-wise Placement Percentage by Branch', y);
      y += 20;
      if (charts) {
        doc.image(charts.genderGroupedBar, MARGIN, y, { width: CONTENT_W, height: 220 });
      } else {
        drawPlaceholder(doc, MARGIN, y, CONTENT_W, 180, 'Gender grouped bar chart');
      }
    }
  } else {
    // ── Class-wise stacked overview (when gender is hidden) ──────────────────
    const spaceLeft = PAGE_H - MARGIN - y - 35;
    if (spaceLeft > 160) {
      chartTitle(doc, 'Class-wise Student Status Overview', y);
      y += 20;
      if (charts) {
        doc.image(charts.classStackedBar, MARGIN, y, { width: CONTENT_W, height: Math.min(spaceLeft - 20, 210) });
      } else {
        drawPlaceholder(doc, MARGIN, y, CONTENT_W, 180, 'Class stacked bar chart');
      }
    }
  }

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 3 — CTC & Offer Type Analysis
// ═══════════════════════════════════════════════════════════════════════════
function drawPage3(doc: PDFKit.PDFDocument, _stats: PlacementStats, ctcStats: CtcStats, charts: ChartBuffers | null, opts: ReportOptions, pageNum: number) {
  drawPageHeader(doc, 'CTC & Offer Type Analysis');
  let y = 80;

  // ── CTC summary cards (placement offers only — internships excluded) ───────
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

  // ── Offer type bar (full width) ────────────────────────────────────────────
  chartTitle(doc, 'Offer Type Distribution', y);
  y += 20;
  const offerChartH = 200;
  if (charts) {
    doc.image(charts.offerTypeBar, MARGIN, y, { width: CONTENT_W, height: offerChartH });
  } else {
    drawPlaceholder(doc, MARGIN, y, CONTENT_W, offerChartH, 'Offer type bar chart');
  }
  y += offerChartH + 10;

  // ── Offer type breakdown table (with CTC band column) ─────────────────────
  const allOffers = Object.values(ctcStats.offerTypeBreakdown).reduce((s, v) => s + v, 0);
  const otCols = [
    { header: 'Offer Type',  width: 110, align: 'left'   as const },
    { header: 'CTC Band',    width: 110, align: 'left'   as const },
    { header: 'Count',       width: 70,  align: 'center' as const },
    { header: '% of Offers', width: 90,  align: 'center' as const },
  ];
  const OFFER_BANDS: Record<string, string> = {
    'Internship':  'Stipend',
    'Regular':     '0 – 6 LPA',
    'Dream':       '6 – 10 LPA',
    'Super Dream': '10 – 20 LPA',
    'Marquee':     '20+ LPA',
  };
  const otRows = (['Internship', 'Regular', 'Dream', 'Super Dream', 'Marquee'] as const).map(t => [
    t,
    OFFER_BANDS[t],
    String(ctcStats.offerTypeBreakdown[t] ?? 0),
    `${allOffers > 0 ? ((ctcStats.offerTypeBreakdown[t] ?? 0) / allOffers * 100).toFixed(1) : 0}%`,
  ]);
  otRows.push(['Total', '', String(allOffers), '100%']);
  y = drawTable(doc, otCols, otRows, y, { lastRowBold: true, fontSize: 9 });
  y += 18;

  // ── CTC bracket distribution chart (optional) ─────────────────────────────
  if (opts.showCtcBrackets) {
    const remainH = PAGE_H - MARGIN - y - 35;
    if (remainH < 180) {
      doc.addPage();
      drawPageHeader(doc, 'CTC & Offer Type Analysis (cont.)');
      y = 80;
    }
    chartTitle(doc, 'CTC Bracket Distribution (placement offers only)', y);
    y += 20;
    if (charts) {
      doc.image(charts.ctcBracketsBar, MARGIN, y, { width: CONTENT_W, height: 200 });
    } else {
      drawPlaceholder(doc, MARGIN, y, CONTENT_W, 180, 'CTC bracket chart');
    }
    y += 210;
  }

  // ── Month-by-month timeline (optional) ────────────────────────────────────
  if (opts.showTimeline) {
    const remainH = PAGE_H - MARGIN - y - 35;
    if (remainH < 180) {
      doc.addPage();
      drawPageHeader(doc, 'CTC & Offer Type Analysis (cont.)');
      y = 80;
    }
    chartTitle(doc, 'Month-by-month Offer Activity', y);
    y += 20;
    const timelineH = Math.min(PAGE_H - MARGIN - y - 35, 200);
    if (charts) {
      doc.image(charts.timeline, MARGIN, y, { width: CONTENT_W, height: timelineH });
    } else {
      drawPlaceholder(doc, MARGIN, y, CONTENT_W, timelineH, 'Timeline chart');
    }
  }

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE 4 — Company Analysis (optional, only with --companies flag)
// ═══════════════════════════════════════════════════════════════════════════
function drawPage4(doc: PDFKit.PDFDocument, stats: PlacementStats, pageNum: number, charts?: ChartBuffers | null) {
  drawPageHeader(doc, 'Company-wise Analysis');
  let y = 80;

  // ── Top recruiters chart ───────────────────────────────────────────────────
  chartTitle(doc, 'Top 10 Recruiters by Offer Count', y);
  y += 20;
  if (charts) {
    doc.image(charts.topRecruitersHBar, MARGIN, y, { width: CONTENT_W, height: 240 });
    y += 248;
  } else {
    drawPlaceholder(doc, MARGIN, y, CONTENT_W, 200, 'Top recruiters chart');
    y += 210;
  }

  // ── Company table with merged branch columns (AIDS, IOT, CS) ──────────────
  const companyCols = [
    { header: 'Company',  width: 170, align: 'left'   as const },
    { header: 'Total',    width: 48,  align: 'center' as const },
    ...MERGED_BRANCH_ORDER.map(b => ({ header: b, width: 90, align: 'center' as const })),
  ];

  const companyRows = stats.companies.map(c => [
    c.name,
    String(c.totalOffers),
    ...MERGED_BRANCH_ORDER.map(b => {
      const n = c.branchWise[b] ?? 0;
      return n > 0 ? String(n) : '-';
    }),
  ]);

  companyRows.push([
    'Total',
    String(stats.totalOffers),
    ...MERGED_BRANCH_ORDER.map(b => String(stats.mergedBranches.find(x => x.label === b)?.totalOffers ?? 0)),
  ]);

  y = drawTable(doc, companyCols, companyRows, y, { lastRowBold: true, fontSize: 8.5 });

  drawFooter(doc, pageNum);
}

// ═══════════════════════════════════════════════════════════════════════════
// Reusable drawing utilities
// ═══════════════════════════════════════════════════════════════════════════

function chartTitle(doc: PDFKit.PDFDocument, text: string, y: number) {
  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(12)
     .text(text, MARGIN, y, { width: CONTENT_W });
}

function drawPageHeader(doc: PDFKit.PDFDocument, sectionTitle: string) {
  doc.rect(0, 0, PAGE_W, 64).fill(NAVY);

  const logoExists = SHOW_LOGO && fs.existsSync(LOGO_PATH);
  if (logoExists) {
    const logoH = 36;
    const logoW = Math.round(logoH * (320 / 90));
    doc.image(LOGO_PATH, MARGIN, (64 - logoH) / 2, { width: logoW, height: logoH });
  }

  const textX = logoExists ? MARGIN + Math.round(36 * (320 / 90)) + 8 : MARGIN;
  const textW = PAGE_W - textX - MARGIN;

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(13)
     .text(INSTITUTION, textX, 10, { width: textW, align: 'center' });
  doc.fillColor('#93C5FD').font('Helvetica').fontSize(11)
     .text(sectionTitle, textX, 32, { width: textW, align: 'center' });
}

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number) {
  const fy = PAGE_H - 28;
  doc.rect(0, fy - 6, PAGE_W, 34).fill('#F8FAFC');
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text(INSTITUTION, MARGIN, fy, { width: CONTENT_W / 2, align: 'left' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
     .text(`Page ${pageNum}`, MARGIN, fy, { width: CONTENT_W, align: 'right' });
}

function drawPlaceholder(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, label: string) {
  doc.rect(x, y, w, h).stroke(LGRAY);
  doc.fillColor(GRAY).font('Helvetica').fontSize(10)
     .text(label, x, y + h / 2 - 8, { width: w, align: 'center' });
}

interface ColDef {
  header: string;
  width: number;
  align: 'left' | 'center' | 'right';
}

interface TableOptions {
  lastRowBold?: boolean;
  fontSize?: number;
}

function drawTable(
  doc: PDFKit.PDFDocument,
  cols: ColDef[],
  rows: string[][],
  startY: number,
  opts: TableOptions = {},
): number {
  const { lastRowBold = false, fontSize = 9 } = opts;
  const rowH = fontSize < 9 ? 16 : 18;
  const headerH = rowH + 2;
  const cellPadX = 5;

  const totalW = cols.reduce((s, c) => s + c.width, 0);
  const tableX = MARGIN + (CONTENT_W - totalW) / 2;

  let y = startY;

  // ── Header row ────────────────────────────────────────────────────────────
  doc.rect(tableX, y, totalW, headerH).fill(NAVY);

  let cx = tableX;
  for (const col of cols) {
    doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(fontSize)
       .text(col.header, cx + cellPadX, y + 4, { width: col.width - cellPadX * 2, align: col.align, lineBreak: false });
    cx += col.width;
  }
  y += headerH;

  // ── Data rows ─────────────────────────────────────────────────────────────
  for (let ri = 0; ri < rows.length; ri++) {
    const isLast = ri === rows.length - 1;
    const isBold = isLast && lastRowBold;

    if (y + rowH > PAGE_H - MARGIN - 30) {
      doc.addPage();
      drawPageHeader(doc, '');
      y = 70;

      doc.rect(tableX, y, totalW, headerH).fill(NAVY);
      cx = tableX;
      for (const col of cols) {
        doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(fontSize)
           .text(col.header, cx + cellPadX, y + 4, { width: col.width - cellPadX * 2, align: col.align, lineBreak: false });
        cx += col.width;
      }
      y += headerH;
    }

    const bg = isBold ? '#DBEAFE' : (ri % 2 === 0 ? WHITE : LGRAY);
    doc.rect(tableX, y, totalW, rowH).fill(bg);

    cx = tableX;
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci];
      const text = rows[ri][ci] ?? '';
      doc.fillColor(isBold ? NAVY : BLACK)
         .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(fontSize)
         .text(text, cx + cellPadX, y + (rowH - fontSize) / 2, {
           width: col.width - cellPadX * 2,
           align: col.align,
           lineBreak: false,
         });
      cx += col.width;
    }

    doc.moveTo(tableX, y + rowH).lineTo(tableX + totalW, y + rowH)
       .stroke('#E5E7EB');

    y += rowH;
  }

  return y;
}
