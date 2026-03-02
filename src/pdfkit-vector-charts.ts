/**
 * pdfkit-vector-charts.ts
 *
 * Draws all charts that pdf-generator.ts normally gets as Chart.js PNG buffers,
 * but as native PDFKit vector graphics directly onto a PDFDocument.
 *
 * Each draw function accepts the PDFDocument, the data, a bounding box (x, y, w, h),
 * and renders the chart inline — no images, no buffers, pure vectors.
 */

import type PDFDocument from 'pdfkit';
import type { PlacementStats, CtcStats, BranchStats } from './types.js';
import { MERGED_BRANCH_COLORS, BRANCH_COLORS, MERGED_BRANCH_ORDER, BRANCH_ORDER } from './config.js';

type Doc = PDFKit.PDFDocument;

// ─── Palette (mirrors pdf-generator.ts) ──────────────────────────────────────
const NAVY   = '#1E3A5F';
const WHITE  = '#FFFFFF';
const GRAY   = '#6B7280';
const BLACK  = '#111827';
const GREEN  = '#16A34A';
const RED    = '#DC2626';
const BLUE   = '#2563EB';
const PURPLE = '#7C3AED';
const ORANGE = '#EA580C';
const TEAL   = '#0891B2';
const GOLD   = '#CA8A04';
const LGRAY  = '#E5E7EB';

// Status segment colors for stacked bars
const STATUS_COLORS = {
  placed:    GREEN,
  notPlaced: RED,
  hold:      GOLD,
  dropped:   GRAY,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Draw a horizontal grid line (light gray dashed feel via short rect) */
function hGrid(doc: Doc, x: number, y: number, w: number) {
  doc.save().strokeColor(LGRAY).lineWidth(0.5).moveTo(x, y).lineTo(x + w, y).stroke().restore();
}

/** Draw axis label text */
function axisLabel(doc: Doc, text: string, x: number, y: number, opts?: { align?: 'left' | 'center' | 'right'; width?: number; color?: string }) {
  doc.save()
     .font('Helvetica').fontSize(7.5)
     .fillColor(opts?.color ?? GRAY)
     .text(text, x, y, {
       align: opts?.align ?? 'center',
       width: opts?.width ?? 60,
       lineBreak: false,
     })
     .restore();
}

/** Draw a small colored legend swatch + label */
function legendItem(doc: Doc, color: string, label: string, x: number, y: number): number {
  const swatchW = 10;
  const swatchH = 8;
  doc.save().rect(x, y, swatchW, swatchH).fill(color).restore();
  doc.save().font('Helvetica').fontSize(8).fillColor(BLACK)
     .text(label, x + swatchW + 4, y, { lineBreak: false }).restore();
  return x + swatchW + 4 + doc.widthOfString(label) + 14;
}

/** Render a row of legend items centred inside a given width */
function drawLegend(doc: Doc, items: { color: string; label: string }[], x: number, y: number, totalW: number) {
  // Measure total legend width first
  doc.save().font('Helvetica').fontSize(8);
  const itemWidths = items.map(it => 10 + 4 + doc.widthOfString(it.label) + 14);
  const legendW = itemWidths.reduce((s, w) => s + w, 0);
  doc.restore();

  let lx = x + (totalW - legendW) / 2;
  for (const it of items) {
    lx = legendItem(doc, it.color, it.label, lx, y);
  }
}

// ─── PIE CHART ───────────────────────────────────────────────────────────────

function polarXY(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function pieSlicePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const steps = 180;
  const [sx, sy] = polarXY(cx, cy, r, startDeg);
  let d = `M ${cx} ${cy} L ${sx} ${sy}`;
  for (let i = 1; i <= steps; i++) {
    const angle = startDeg + ((endDeg - startDeg) * i) / steps;
    const [px, py] = polarXY(cx, cy, r, angle);
    d += ` L ${px} ${py}`;
  }
  d += ' Z';
  return d;
}

export function drawPieChart(
  doc: Doc,
  slices: { label: string; value: number; color: string; sublabel?: string }[],
  x: number, y: number, w: number, h: number,
) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  if (total === 0) return;

  const legendH = 16;
  const chartH  = h - legendH - 6;
  const r       = Math.min(w / 2, chartH / 2) * 0.88;
  const cx      = x + w / 2;
  const cy      = y + chartH / 2;

  // Draw slices
  let deg = -90;
  for (const sl of slices) {
    if (sl.value === 0) continue;
    const sweep = (sl.value / total) * 360;
    const pathD = pieSlicePath(cx, cy, r, deg, deg + sweep);
    doc.save().path(pathD).fill(sl.color).restore();
    deg += sweep;
  }

  // White hairline borders between slices (second pass)
  deg = -90;
  for (const sl of slices) {
    if (sl.value === 0) continue;
    const sweep = (sl.value / total) * 360;
    const [ex, ey] = polarXY(cx, cy, r, deg);
    doc.save().strokeColor(WHITE).lineWidth(0.8)
       .moveTo(cx, cy).lineTo(ex, ey).stroke().restore();
    deg += sweep;
  }

  // Count labels inside slices — no percentages, no ambiguity
  deg = -90;
  for (const sl of slices) {
    if (sl.value === 0) continue;
    const sweep = (sl.value / total) * 360;
    const pct   = (sl.value / total) * 100;
    if (pct >= 5) {
      const midDeg   = deg + sweep / 2;
      const [lx, ly] = polarXY(cx, cy, r * 0.65, midDeg);
      doc.save()
         .font('Helvetica-Bold').fontSize(11).fillColor(WHITE)
         .text(String(sl.value), lx - 26, ly - 6, { width: 52, align: 'center', lineBreak: false })
         .restore();
    }
    deg += sweep;
  }

  // Legend below
  const legendY = y + chartH + 4;
  drawLegend(doc, slices.map(sl => ({ color: sl.color, label: sl.label })), x, legendY, w);
}

// ─── HORIZONTAL BAR CHART (branch placement %) ───────────────────────────────

export function drawHBarChart(
  doc: Doc,
  bars: { label: string; value: number; color: string; annotation?: string }[],
  x: number, y: number, w: number, h: number,
  maxValue = 100,
  unit = '%',
) {
  const labelW  = 80;
  const annW    = 40;
  const chartX  = x + labelW;
  const chartW  = w - labelW - annW;
  const barH    = clamp(Math.floor((h - 20) / bars.length) - 5, 10, 36);
  const gap     = clamp(Math.floor((h - 20 - bars.length * barH) / (bars.length + 1)), 4, 12);

  // Grid lines at 0 25 50 75 100
  const gridPcts = [0, 25, 50, 75, 100];
  for (const pct of gridPcts) {
    const gx = chartX + (pct / maxValue) * chartW;
    doc.save().strokeColor(LGRAY).lineWidth(0.5).moveTo(gx, y).lineTo(gx, y + h - 14).stroke().restore();
    axisLabel(doc, `${pct}${unit}`, gx - 12, y + h - 12, { width: 24, align: 'center', color: GRAY });
  }

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const by  = y + gap + i * (barH + gap);
    const bw  = Math.max(0, (bar.value / maxValue) * chartW);

    // Label
    doc.save().font('Helvetica').fontSize(8).fillColor(BLACK)
       .text(bar.label, x, by + (barH - 8) / 2, { width: labelW - 6, align: 'right', lineBreak: false })
       .restore();

    // Track
    doc.save().roundedRect(chartX, by, chartW, barH, 3).fill(LGRAY).restore();

    // Bar
    if (bw > 2) {
      doc.save().roundedRect(chartX, by, bw, barH, 3).fill(bar.color).restore();
    }

    // Value inside/outside bar
    const valText = `${bar.value}${unit}`;
    doc.save().font('Helvetica-Bold').fontSize(7.5);
    if (bw > 36) {
      doc.fillColor(WHITE).text(valText, chartX + bw - 32, by + (barH - 7) / 2, { width: 28, align: 'right', lineBreak: false });
    } else {
      doc.fillColor(BLACK).text(valText, chartX + bw + 3, by + (barH - 7) / 2, { width: 30, lineBreak: false });
    }
    doc.restore();

    // Annotation (e.g. "212/275")
    if (bar.annotation) {
      doc.save().font('Helvetica').fontSize(7).fillColor(GRAY)
         .text(bar.annotation, chartX + chartW + 3, by + (barH - 7) / 2, { width: annW - 3, lineBreak: false })
         .restore();
    }
  }
}

// ─── VERTICAL BAR CHART (offer types, timeline, CTC brackets) ────────────────

export function drawVBarChart(
  doc: Doc,
  bars: { label: string; value: number; color: string }[],
  x: number, y: number, w: number, h: number,
) {
  if (bars.length === 0) return;

  const labelH  = 20;
  const countH  = 12;
  const yAxisW  = 28;
  const chartX  = x + yAxisW;
  const chartW  = w - yAxisW;
  const chartH  = h - labelH - countH - 6;
  const baseY   = y + countH + chartH;
  const groupW  = chartW / bars.length;
  const maxVal  = Math.max(...bars.map(b => b.value), 1);

  // Y-axis gridlines + labels
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val  = Math.round((maxVal / steps) * i);
    const gy   = baseY - (val / maxVal) * chartH;
    hGrid(doc, chartX, gy, chartW);
    axisLabel(doc, String(val), x, gy - 4, { width: yAxisW - 3, align: 'right' });
  }

  // Bars
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const gx  = chartX + i * groupW;
    const bx  = gx + groupW * 0.15;
    const bw  = groupW * 0.7;
    const bh  = (bar.value / maxVal) * chartH;

    if (bh > 0.5) {
      doc.save().roundedRect(bx, baseY - bh, bw, bh, 2).fill(bar.color).restore();
    }

    // Count above bar
    doc.save().font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
       .text(String(bar.value), bx - 4, baseY - bh - 11, { width: bw + 8, align: 'center', lineBreak: false })
       .restore();

    // Label below
    doc.save().font('Helvetica').fontSize(7.5).fillColor(GRAY)
       .text(bar.label, gx, baseY + 4, { width: groupW, align: 'center', lineBreak: false })
       .restore();
  }

  // X-axis line
  doc.save().strokeColor('#9CA3AF').lineWidth(0.8)
     .moveTo(chartX, baseY).lineTo(chartX + chartW, baseY).stroke().restore();
}

// ─── STACKED VERTICAL BAR (class overview) ───────────────────────────────────

export function drawClassStackedBar(
  doc: Doc,
  branches: BranchStats[],
  x: number, y: number, w: number, h: number,
) {
  type SegKey = 'placed' | 'notPlaced' | 'higherStudies' | 'internshipOnly';
  const segments: { key: SegKey; color: string; label: string }[] = [
    { key: 'placed',         color: GREEN,  label: 'Placed'          },
    { key: 'notPlaced',      color: RED,    label: 'Not Placed'      },
    { key: 'higherStudies',  color: BLUE,   label: 'Higher Studies'  },
    { key: 'internshipOnly', color: ORANGE, label: 'Internship Only' },
  ];

  const legendH = 16;
  drawLegend(doc, segments.map(s => ({ color: s.color, label: s.label })), x, y, w);

  const yAxisW = 32;
  const labelH = 20;
  const countH = 14;
  const chartX = x + yAxisW;
  const chartW = w - yAxisW;
  const chartH = h - legendH - labelH - countH - 8;
  const baseY  = y + legendH + countH + chartH;
  const groupW = chartW / branches.length;

  const maxTotal = Math.max(...branches.map(b => b.totalStudents), 1);

  // Y-axis gridlines
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const val = Math.round((maxTotal / ySteps) * i);
    const gy  = baseY - (val / maxTotal) * chartH;
    hGrid(doc, chartX, gy, chartW);
    axisLabel(doc, String(val), x, gy - 4, { width: yAxisW - 3, align: 'right' });
  }

  for (let i = 0; i < branches.length; i++) {
    const b  = branches[i];
    const gx = chartX + i * groupW;
    const bx = gx + groupW * 0.15;
    const bw = groupW * 0.7;

    let stackY = baseY;
    for (const seg of segments) {
      const val = b[seg.key] as number;
      if (val === 0) continue;
      const bh = (val / maxTotal) * chartH;
      stackY -= bh;
      doc.save().rect(bx, stackY, bw, bh).fill(seg.color).restore();

      if (bh >= 14) {
        // Label inside segment
        doc.save().font('Helvetica').fontSize(8).fillColor(WHITE)
           .text(String(val), bx, stackY + (bh - 8) / 2, { width: bw, align: 'center', lineBreak: false })
           .restore();
      } else if (bh >= 4) {
        // Too thin for inside — show value just above in matching color
        doc.save().font('Helvetica').fontSize(7).fillColor(seg.color)
           .text(String(val), bx, stackY - 9, { width: bw, align: 'center', lineBreak: false })
           .restore();
      }
    }

    // Total above full bar
    doc.save().font('Helvetica-Bold').fontSize(8).fillColor(BLACK)
       .text(String(b.totalStudents), bx - 4, stackY - 13, { width: bw + 8, align: 'center', lineBreak: false })
       .restore();

    // Branch label below
    doc.save().font('Helvetica').fontSize(9).fillColor(GRAY)
       .text(b.label, gx, baseY + 5, { width: groupW, align: 'center', lineBreak: false })
       .restore();
  }

  doc.save().strokeColor('#9CA3AF').lineWidth(0.8)
     .moveTo(chartX, baseY).lineTo(chartX + chartW, baseY).stroke().restore();
}

// ─── GROUPED BAR (gender comparison) ─────────────────────────────────────────

export function drawGenderGroupedBar(
  doc: Doc,
  branches: BranchStats[],
  x: number, y: number, w: number, h: number,
  useSections = false,
) {
  const legendH = 16;
  const labelH  = 18;
  const yAxisW  = 28;
  const chartX  = x + yAxisW;
  const chartW  = w - yAxisW;
  const chartH  = h - legendH - labelH - 8;
  const baseY   = y + legendH + chartH;
  const groupW  = chartW / branches.length;
  const barW    = groupW * 0.32;

  // Legend
  drawLegend(doc, [
    { color: BLUE,   label: 'Male %'   },
    { color: ORANGE, label: 'Female %' },
  ], x, y, w);

  // Y-axis 0–100%
  for (let pct = 0; pct <= 100; pct += 25) {
    const gy = baseY - (pct / 100) * chartH;
    hGrid(doc, chartX, gy, chartW);
    axisLabel(doc, `${pct}%`, x, gy - 4, { width: yAxisW - 3, align: 'right' });
  }

  for (let i = 0; i < branches.length; i++) {
    const b  = branches[i];
    const gx = chartX + i * groupW;

    // Male bar
    const mh = (b.malePlacedPercent / 100) * chartH;
    const mx = gx + groupW * 0.1;
    if (mh > 0.5) doc.save().roundedRect(mx, baseY - mh, barW, mh, 2).fill(BLUE).restore();
    if (mh > 10) {
      doc.save().font('Helvetica').fontSize(6.5).fillColor(WHITE)
         .text(`${b.malePlacedPercent}%`, mx, baseY - mh + 3, { width: barW, align: 'center', lineBreak: false })
         .restore();
    }

    // Female bar
    const fh = (b.femalePlacedPercent / 100) * chartH;
    const fx = gx + groupW * 0.1 + barW + 3;
    if (fh > 0.5) doc.save().roundedRect(fx, baseY - fh, barW, fh, 2).fill(ORANGE).restore();
    if (fh > 10) {
      doc.save().font('Helvetica').fontSize(6.5).fillColor(WHITE)
         .text(`${b.femalePlacedPercent}%`, fx, baseY - fh + 3, { width: barW, align: 'center', lineBreak: false })
         .restore();
    }

    // Group label
    doc.save().font('Helvetica').fontSize(8).fillColor(GRAY)
       .text(b.label, gx, baseY + 4, { width: groupW, align: 'center', lineBreak: false })
       .restore();
  }

  // X-axis line
  doc.save().strokeColor('#9CA3AF').lineWidth(0.8)
     .moveTo(chartX, baseY).lineTo(chartX + chartW, baseY).stroke().restore();
}

// ─── TOP RECRUITERS HORIZONTAL BAR ───────────────────────────────────────────

export function drawTopRecruitersHBar(
  doc: Doc,
  stats: PlacementStats,
  x: number, y: number, w: number, h: number,
) {
  const top    = stats.topRecruiters.slice(0, 10);
  const maxVal = top[0]?.totalOffers ?? 1;
  const colors = [...MERGED_BRANCH_COLORS, ...MERGED_BRANCH_COLORS, ...MERGED_BRANCH_COLORS, ...MERGED_BRANCH_COLORS];

  drawHBarChart(
    doc,
    top.map((c, i) => ({
      label:      c.name.length > 20 ? c.name.slice(0, 19) + '…' : c.name,
      value:      c.totalOffers,
      color:      colors[i % colors.length],
      annotation: `${c.totalOffers} offer${c.totalOffers !== 1 ? 's' : ''}`,
    })),
    x, y, w, h,
    maxVal,
    '',
  );
}

// ─── OFFER TYPE BAR ───────────────────────────────────────────────────────────

export function drawOfferTypeBar(
  doc: Doc,
  ctcStats: CtcStats,
  x: number, y: number, w: number, h: number,
) {
  const OFFER_COLORS: Record<string, string> = {
    'Internship':  TEAL,
    'Regular':     BLUE,
    'Dream':       PURPLE,
    'Super Dream': ORANGE,
    'Marquee':     RED,
  };

  const bars = (['Internship', 'Regular', 'Dream', 'Super Dream', 'Marquee'] as const)
    .map(t => ({
      label: t,
      value: ctcStats.offerTypeBreakdown[t] ?? 0,
      color: OFFER_COLORS[t],
    }))
    .filter(b => b.value > 0);

  drawVBarChart(doc, bars, x, y, w, h);
}

// ─── CTC BRACKETS BAR ────────────────────────────────────────────────────────

export function drawCtcBracketsBar(
  doc: Doc,
  ctcStats: CtcStats,
  x: number, y: number, w: number, h: number,
) {
  // Derive bracket counts from offerTypeBreakdown (Regular→0–6, Dream→6–10, SuperDream→10–20, Marquee→20+)
  const GRADIENT = ['#BFDBFE', '#60A5FA', '#2563EB', '#1D4ED8'];
  const brackets = [
    { label: '0–6 LPA',  value: ctcStats.offerTypeBreakdown['Regular']     ?? 0, color: GRADIENT[0] },
    { label: '6–10 LPA', value: ctcStats.offerTypeBreakdown['Dream']        ?? 0, color: GRADIENT[1] },
    { label: '10–20 LPA',value: ctcStats.offerTypeBreakdown['Super Dream']  ?? 0, color: GRADIENT[2] },
    { label: '20+ LPA',  value: ctcStats.offerTypeBreakdown['Marquee']      ?? 0, color: GRADIENT[3] },
  ].filter(b => b.value > 0);

  drawVBarChart(doc, brackets, x, y, w, h);
}

// ─── TIMELINE BAR ─────────────────────────────────────────────────────────────

export function drawTimelineBar(
  doc: Doc,
  ctcStats: CtcStats,
  x: number, y: number, w: number, h: number,
) {
  if (ctcStats.monthlyTimeline.length === 0) return;

  const bars = ctcStats.monthlyTimeline.map(m => ({
    label: m.label,
    value: m.count,
    color: BLUE,
  }));

  drawVBarChart(doc, bars, x, y, w, h);
}

// ─── BRANCH CTC BAR (avg vs median per branch) ───────────────────────────────

export interface BranchCtcRow {
  label:     string;
  avgCtc:    number;  // rupees
  medianCtc: number;  // rupees
}

/** Format a CTC value as a compact INR string (e.g. 8.4 L, 1.2 Cr) */
function fmtLpa(rupees: number): string {
  if (rupees >= 1_00_00_000) return `${(rupees / 1_00_00_000).toFixed(1)} Cr`;
  if (rupees >= 1_00_000)    return `${(rupees / 1_00_000).toFixed(1)} L`;
  return `₹${rupees.toLocaleString('en-IN')}`;
}

export function drawBranchCtcBar(
  doc: Doc,
  rows: BranchCtcRow[],
  x: number, y: number, w: number, h: number,
) {
  if (rows.length === 0) return;

  const AVG_COLOR    = TEAL;
  const MEDIAN_COLOR = PURPLE;

  // Layout
  const legendH  = 16;
  const labelH   = 22;   // x-axis branch labels
  const valueH   = 14;   // value labels above bars
  const yAxisW   = 36;
  const chartX   = x + yAxisW;
  const chartW   = w - yAxisW;
  const chartH   = h - legendH - labelH - valueH - 6;
  const baseY    = y + legendH + valueH + chartH;
  const groupW   = chartW / rows.length;
  const barW     = groupW * 0.3;
  const barGap   = groupW * 0.04;

  const maxVal  = Math.max(...rows.flatMap(r => [r.avgCtc, r.medianCtc]), 1);
  const gridMax = Math.ceil(maxVal / 1_00_000) * 1_00_000;

  // Legend (top)
  drawLegend(doc, [
    { color: AVG_COLOR,    label: 'Avg CTC'    },
    { color: MEDIAN_COLOR, label: 'Median CTC' },
  ], x, y, w);

  // Y-axis gridlines + labels
  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const val = (gridMax / ySteps) * i;
    const gy  = baseY - (val / gridMax) * chartH;
    hGrid(doc, chartX, gy, chartW);
    axisLabel(doc, fmtLpa(val), x, gy - 4, { width: yAxisW - 3, align: 'right' });
  }

  // X-axis line
  doc.save().strokeColor('#9CA3AF').lineWidth(0.8)
     .moveTo(chartX, baseY).lineTo(chartX + chartW, baseY).stroke().restore();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const gx  = chartX + i * groupW + groupW * 0.08;

    // Avg bar (left of pair)
    const avgH = (row.avgCtc / gridMax) * chartH;
    const ax   = gx;
    if (avgH > 0.5) doc.save().roundedRect(ax, baseY - avgH, barW, avgH, 2).fill(AVG_COLOR).restore();
    doc.save().font('Helvetica-Bold').fontSize(7).fillColor(AVG_COLOR)
       .text(fmtLpa(row.avgCtc), ax - 4, baseY - avgH - 11, { width: barW + 8, align: 'center', lineBreak: false })
       .restore();

    // Median bar (right of pair)
    const medH = (row.medianCtc / gridMax) * chartH;
    const mx   = gx + barW + barGap;
    if (medH > 0.5) doc.save().roundedRect(mx, baseY - medH, barW, medH, 2).fill(MEDIAN_COLOR).restore();
    doc.save().font('Helvetica-Bold').fontSize(7).fillColor(MEDIAN_COLOR)
       .text(fmtLpa(row.medianCtc), mx - 4, baseY - medH - 11, { width: barW + 8, align: 'center', lineBreak: false })
       .restore();

    // Branch/section label below group
    doc.save().font('Helvetica').fontSize(8.5).fillColor(GRAY)
       .text(row.label, chartX + i * groupW, baseY + 5, { width: groupW, align: 'center', lineBreak: false })
       .restore();
  }
}

// ─── BRANCH BAR (merged or sections) — horizontal bars ───────────────────────

export function drawBranchBar(
  doc: Doc,
  stats: PlacementStats,
  x: number, y: number, w: number, h: number,
  useSections = false,
) {
  const branches = useSections ? stats.branches : stats.mergedBranches;
  const colors   = useSections ? BRANCH_COLORS  : MERGED_BRANCH_COLORS;

  drawHBarChart(
    doc,
    branches.map((b, i) => ({
      label:      b.label,
      value:      b.placementPercent,
      color:      colors[i % colors.length],
      annotation: `${b.placed}/${b.optPlacement}`,
    })),
    x, y, w, h,
  );
}
