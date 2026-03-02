import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration, TooltipItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { PlacementStats, CtcStats, ChartBuffers, ReportOptions } from './types.js';
import { BRANCH_ORDER, BRANCH_COLORS, MERGED_BRANCH_ORDER, MERGED_BRANCH_COLORS } from './config.js';

Chart.register(...registerables);

// chartjs-node-canvas's renderToBuffer accepts ChartConfiguration (unparameterized).
// Typing each config as ChartConfiguration<'bar'> propagates the chart type all
// the way into tooltip callbacks, so TooltipItem<'bar'> is valid — no `any` needed.
async function render<T extends ChartConfiguration>(
  canvas: ChartJSNodeCanvas,
  config: T,
): Promise<Buffer> {
  return (await canvas.renderToBuffer(config)) as unknown as Buffer;
}

function makeCanvas(width: number, height: number) {
  return new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: 'white',
    // Register datalabels inside the canvas's isolated Chart.js context
    chartCallback: (ChartJS) => { ChartJS.register(ChartDataLabels); },
  });
}

// All chart titles are added by PDFKit (bold navy text above the image)
export async function generateCharts(stats: PlacementStats, ctcStats: CtcStats, opts?: ReportOptions): Promise<ChartBuffers> {
  const [
    overallPie, branchBarMerged, branchBarSections,
    classStackedBar, genderGroupedBar,
    offerTypeBar, ctcBracketsBar, topRecruitersHBar, timeline,
  ] = await Promise.all([
    renderOverallPie(stats),
    renderBranchBarMerged(stats),
    renderBranchBarSections(stats),
    renderClassStackedBar(stats),
    renderGenderGroupedBar(stats, opts?.showSections ?? false),
    renderOfferTypeBar(ctcStats),
    renderCtcBracketsBar(ctcStats),
    renderTopRecruitersHBar(stats),
    renderTimeline(ctcStats),
  ]);

  return {
    overallPie, branchBarMerged, branchBarSections,
    classStackedBar, genderGroupedBar,
    offerTypeBar, ctcBracketsBar, topRecruitersHBar, timeline,
  };
}

// ─── Individual chart renderers ──────────────────────────────────────────────

async function renderOverallPie(stats: PlacementStats): Promise<Buffer> {
  const canvas = makeCanvas(900, 640);
  // Use opted count as denominator so percentages match the official metric
  // (placed / optPlacement = 77.1%, not placed / total = 71.6%)
  const optTotal = stats.optPlacement; // placed + notPlaced
  const config: ChartConfiguration<'pie'> = {
    type: 'pie',
    data: {
      labels: ['Placed', 'Not Placed', 'Higher Studies'],
      datasets: [{
        data: [stats.placed, stats.notPlaced, stats.higherStudies],
        backgroundColor: ['#16A34A', '#DC2626', '#2563EB'],
        borderWidth: 3,
        borderColor: '#ffffff',
        // Explode the Placed slice (index 0) outward by 18px
        offset: [18, 0, 0],
      }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 16 }, padding: 20, boxWidth: 20 } },
        title: { display: false },
        datalabels: {
          anchor: 'center',
          align: 'center',
          textAlign: 'center',
          color: '#ffffff',
          font: (ctx) => {
            const value = ctx.dataset.data[ctx.dataIndex] as number;
            const pct = (value / optTotal) * 100;
            return { size: pct < 10 ? 12 : 14, weight: 'bold' as const };
          },
          formatter: (value: number, ctx) => {
            const label = ctx.chart.data.labels?.[ctx.dataIndex] ?? '';
            // Only Placed and Not Placed are expressed as % of opted;
            // Higher Studies is shown as a count only (different denominator)
            if (ctx.dataIndex === 2) {
              return (value / optTotal) * 100 < 8 ? `${value}` : `${label}\n${value}`;
            }
            const pct = ((value / optTotal) * 100).toFixed(1);
            if ((value / optTotal) * 100 < 8) return `${pct}%`;
            return `${label}\n${value} (${pct}%)`;
          },
        },
      },
    },
  };
  return render(canvas, config);
}

async function renderBranchBarMerged(stats: PlacementStats): Promise<Buffer> {
  const canvas = makeCanvas(1100, 580);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: MERGED_BRANCH_ORDER,
      datasets: [{
        data: MERGED_BRANCH_ORDER.map(b => stats.mergedBranches.find(x => x.label === b)?.placementPercent ?? 0),
        backgroundColor: MERGED_BRANCH_COLORS,
        borderRadius: 10,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.y}%` } },
        datalabels: {
          anchor: 'start',
          align: 'top',
          offset: 8,
          clip: false,
          color: '#1e293b',
          font: { size: 18, weight: 'bold' },
          formatter: (value: number) => `${value}%`,
        },
      },
      scales: {
        y: { min: 0, max: 100, ticks: { callback: (v: string | number) => `${v}%`, font: { size: 15 } }, grid: { color: '#E5E7EB' } },
        x: { grid: { display: false }, ticks: { font: { size: 16 } } },
      },
      layout: { padding: { top: 30 } },
    },
  };
  return render(canvas, config);
}

async function renderBranchBarSections(stats: PlacementStats): Promise<Buffer> {
  const canvas = makeCanvas(1200, 580);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: BRANCH_ORDER,
      datasets: [{
        data: BRANCH_ORDER.map(b => stats.branches.find(x => x.label === b)?.placementPercent ?? 0),
        backgroundColor: BRANCH_COLORS,
        borderRadius: 10,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: false },
        tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.y}%` } },
        datalabels: {
          anchor: 'start',
          align: 'top',
          offset: 8,
          clip: false,
          color: '#1e293b',
          font: { size: 14, weight: 'bold' },
          formatter: (value: number) => `${value}%`,
        },
      },
      scales: {
        y: { min: 0, max: 100, ticks: { callback: (v: string | number) => `${v}%`, font: { size: 15 } }, grid: { color: '#E5E7EB' } },
        x: { grid: { display: false }, ticks: { font: { size: 14 } } },
      },
      layout: { padding: { top: 30 } },
    },
  };
  return render(canvas, config);
}

async function renderClassStackedBar(stats: PlacementStats): Promise<Buffer> {
  const canvas = makeCanvas(1100, 500);

  // chartjs-plugin-datalabels doesn't support stacked indexAxis:'y' in SSR.
  // Use a custom afterDraw plugin to draw labels directly onto the canvas.
  const stackedBarLabelsPlugin = {
    id: 'stackedBarLabels',
    afterDraw(chart: Chart) {
      const ctx = chart.ctx;
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index] as number;
          if (value < 8) return; // skip segments too small to label
          const { x, y, width } = bar.getProps(['x', 'y', 'width'], true) as { x: number; y: number; width: number };
          // For indexAxis:'y', x is the right edge of the segment, width is the segment width
          const cx = x - width / 2;
          const cy = y;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(String(value), cx, cy);
        });
      });
      ctx.restore();
    },
  };

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: MERGED_BRANCH_ORDER,
      datasets: [
        { label: 'Placed',          data: MERGED_BRANCH_ORDER.map(b => stats.mergedBranches.find(x => x.label === b)?.placed ?? 0),        backgroundColor: '#16A34A' },
        { label: 'Not Placed',      data: MERGED_BRANCH_ORDER.map(b => stats.mergedBranches.find(x => x.label === b)?.notPlaced ?? 0),     backgroundColor: '#DC2626' },
        { label: 'Higher Studies',  data: MERGED_BRANCH_ORDER.map(b => stats.mergedBranches.find(x => x.label === b)?.higherStudies ?? 0), backgroundColor: '#2563EB' },
        { label: 'Internship Only', data: MERGED_BRANCH_ORDER.map(b => stats.mergedBranches.find(x => x.label === b)?.internshipOnly ?? 0),backgroundColor: '#EA580C' },
      ],
    },
    plugins: [stackedBarLabelsPlugin],
    options: {
      indexAxis: 'y',
      plugins: {
        title: { display: false },
        legend: { position: 'bottom', labels: { font: { size: 14 }, padding: 18 } },
        datalabels: { display: false },
      },
      scales: {
        x: { stacked: true, grid: { color: '#E5E7EB' }, ticks: { font: { size: 14 } } },
        y: { stacked: true, grid: { display: false }, ticks: { font: { size: 15 } } },
      },
    },
  };
  return render(canvas, config);
}

async function renderGenderGroupedBar(stats: PlacementStats, showSections: boolean): Promise<Buffer> {
  // Use section-level data when --sections is active, merged branch data otherwise
  const labels   = showSections ? BRANCH_ORDER        : MERGED_BRANCH_ORDER;
  const source   = showSections ? stats.branches      : stats.mergedBranches;

  const canvas = makeCanvas(showSections ? 1300 : 1100, 580);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Male Placement %',
          data: labels.map(b => source.find(x => x.label === b)?.malePlacedPercent ?? 0),
          backgroundColor: '#2563EB',
          borderRadius: 5,
        },
        {
          label: 'Female Placement %',
          data: labels.map(b => source.find(x => x.label === b)?.femalePlacedPercent ?? 0),
          backgroundColor: '#EC4899',
          borderRadius: 5,
        },
      ],
    },
    options: {
      plugins: {
        title: { display: false },
        legend: { position: 'bottom', labels: { font: { size: 14 }, padding: 18 } },
        tooltip: { callbacks: { label: (ctx: TooltipItem<'bar'>) => `${ctx.dataset.label ?? ''}: ${ctx.parsed.y}%` } },
        datalabels: {
          anchor: 'start',
          align: 'top',
          offset: 6,
          clip: false,
          color: '#1e293b',
          font: { size: 12, weight: 'bold' },
          formatter: (value: number) => `${value}%`,
        },
      },
      scales: {
        y: { min: 0, max: 100, ticks: { callback: (v: string | number) => `${v}%`, font: { size: 14 } }, grid: { color: '#E5E7EB' } },
        x: { grid: { display: false }, ticks: { font: { size: showSections ? 12 : 14 } } },
      },
      layout: { padding: { top: 28 } },
    },
  };
  return render(canvas, config);
}

// CTC range annotations shown on chart x-axis labels
const OFFER_TYPE_LABELS: Record<string, string> = {
  'Internship':  'Internship\n(Stipend)',
  'Regular':     'Regular\n(0–6 LPA)',
  'Dream':       'Dream\n(6–10 LPA)',
  'Super Dream': 'Super Dream\n(10–20 LPA)',
  'Marquee':     'Marquee\n(20+ LPA)',
};

async function renderOfferTypeBar(ctcStats: CtcStats): Promise<Buffer> {
  // Order: low-value to high-value, with Marquee as the top tier
  const ORDER = ['Internship', 'Regular', 'Dream', 'Super Dream', 'Marquee'] as const;
  const COLORS = ['#EA580C', '#2563EB', '#16A34A', '#DC2626', '#7C3AED'];
  const canvas = makeCanvas(1100, 600);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: ORDER.map(t => OFFER_TYPE_LABELS[t] ?? t),
      datasets: [{
        data: ORDER.map(t => ctcStats.offerTypeBreakdown[t] ?? 0),
        backgroundColor: COLORS,
        borderRadius: 8,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: {
          anchor: 'start',
          align: 'top',
          offset: 6,
          clip: false,
          color: '#1e293b',
          font: { size: 14, weight: 'bold' },
          formatter: (value: number) => value,
        },
      },
      scales: {
        y: { grid: { color: '#E5E7EB' }, ticks: { font: { size: 14 } } },
        x: { grid: { display: false }, ticks: { font: { size: 13 } } },
      },
      layout: { padding: { top: 28 } },
    },
  };
  return render(canvas, config);
}

async function renderCtcBracketsBar(ctcStats: CtcStats): Promise<Buffer> {
  // Since offer types are definitionally tied to CTC bands, map directly:
  // Regular → 0–6, Dream → 6–10, Super Dream → 10–20, Marquee → 20+
  const BRACKETS = ['0–6 LPA', '6–10 LPA', '10–20 LPA', '20+ LPA'];
  const COLORS   = ['#2563EB', '#16A34A', '#DC2626', '#7C3AED'];
  const counts   = [
    ctcStats.offerTypeBreakdown['Regular']    ?? 0,
    ctcStats.offerTypeBreakdown['Dream']       ?? 0,
    ctcStats.offerTypeBreakdown['Super Dream'] ?? 0,
    ctcStats.offerTypeBreakdown['Marquee']     ?? 0,
  ];

  const canvas = makeCanvas(1000, 520);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: BRACKETS,
      datasets: [{
        data: counts,
        backgroundColor: COLORS,
        borderRadius: 8,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: {
          anchor: 'start',
          align: 'top',
          offset: 6,
          clip: false,
          color: '#1e293b',
          font: { size: 14, weight: 'bold' },
          formatter: (value: number) => value,
        },
      },
      scales: {
        y: { grid: { color: '#E5E7EB' }, ticks: { stepSize: 1, font: { size: 14 } } },
        x: { grid: { display: false }, ticks: { font: { size: 15 } } },
      },
      layout: { padding: { top: 28 } },
    },
  };
  return render(canvas, config);
}

async function renderTopRecruitersHBar(stats: PlacementStats): Promise<Buffer> {
  const top = stats.topRecruiters.slice(0, 10);
  const canvas = makeCanvas(1200, 680);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: top.map(c => c.name),
      datasets: [{
        data: top.map(c => c.totalOffers),
        backgroundColor: '#2563EB',
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: { display: false },
      },
      scales: {
        x: { grid: { color: '#E5E7EB' }, ticks: { stepSize: 1, font: { size: 13 } } },
        y: { grid: { display: false }, ticks: { font: { size: 13 } } },
      },
    },
  };
  return render(canvas, config);
}

async function renderTimeline(ctcStats: CtcStats): Promise<Buffer> {
  const data = ctcStats.monthlyTimeline;
  const canvas = makeCanvas(1400, 560);
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: '#2563EB',
        borderRadius: 5,
      }],
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: false },
        datalabels: {
          anchor: 'start',
          align: 'top',
          offset: 4,
          clip: false,
          color: '#1e293b',
          font: { size: 12, weight: 'bold' },
          display: (ctx) => (ctx.dataset.data[ctx.dataIndex] as number) > 0,
          formatter: (value: number) => value,
        },
      },
      scales: {
        y: { grid: { color: '#E5E7EB' }, ticks: { stepSize: 1, font: { size: 13 } } },
        x: { grid: { display: false }, ticks: { font: { size: 12 }, maxRotation: 45 } },
      },
      layout: { padding: { top: 24 } },
    },
  };
  return render(canvas, config);
}
