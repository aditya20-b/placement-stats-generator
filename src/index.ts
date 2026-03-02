#!/usr/bin/env node
import { Command } from 'commander';
import ora from 'ora';
import path from 'path';
import { fetchCsv } from './fetcher.js';
import { parseMasterSheet, parseOfferDetails } from './parser.js';
import { computeStats, computeCtcStats } from './processor.js';
import { getMasterCsvUrl, getOfferDetailsCsvUrl, OUTPUT_DIR, OUTPUT_FILENAME } from './config.js';
import type { ReportOptions } from './types.js';
import { DEFAULT_OPTIONS } from './types.js';

const program = new Command();

program
  .name('placement-stats')
  .description('Generate a placement statistics PDF report from Google Sheets data')
  .version('1.0.0')
  .option('-o, --output <path>', 'Output PDF file path', path.join(OUTPUT_DIR, OUTPUT_FILENAME))
  .option('--renderer <type>',  'Renderer to use: "vector" (default) or "png"', 'vector')
  .option('--no-charts',        'Skip chart generation — PNG renderer only')
  .option('--sections',         'Show individual section breakdown (AIDS A/B, IOT A/B)')
  .option('--gender',           'Include gender-wise placement breakdown chart')
  .option('--class-status',     'Include class-wise stacked student status chart (vector renderer only)')
  .option('--companies',        'Include company-wise breakdown page')
  .option('--no-ctc',           'Hide CTC & offer type analysis page')
  .option('--no-timeline',      'Hide month-by-month offer activity timeline')
  .option('--ctc-brackets',     'Show CTC bracket distribution chart')
  .option('--spreadsheet-id <id>', 'Override the Google Sheets spreadsheet ID')
  .action(async (opts) => {
    if (opts.spreadsheetId) process.env.SPREADSHEET_ID = opts.spreadsheetId;

    const outputPath = opts.output as string;
    const renderer   = (opts.renderer as string).toLowerCase();

    if (renderer !== 'vector' && renderer !== 'png') {
      console.error('❌ --renderer must be "vector" or "png"');
      process.exit(1);
    }

    const reportOpts: ReportOptions = {
      ...DEFAULT_OPTIONS,
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
      spinner.succeed(
        `Data fetched — Master: ${(masterCsv.length / 1024).toFixed(1)} KB, ` +
        `Offers: ${(offerCsv.length / 1024).toFixed(1)} KB`
      );

      spinner.start('Parsing records…');
      const records      = parseMasterSheet(masterCsv);
      const offerRecords = parseOfferDetails(offerCsv);
      spinner.succeed(`Parsed ${records.length} students, ${offerRecords.length} offer records`);

      spinner.start('Computing placement statistics…');
      const stats    = computeStats(records);
      const ctcStats = computeCtcStats(offerRecords);
      spinner.succeed(
        `Stats computed — ${stats.placed}/${stats.optPlacement} placed ` +
        `(${stats.overallPlacementPercent}%) | Median CTC: ₹${(ctcStats.median / 100000).toFixed(2)}L`
      );
      console.log(
        `REPORT_STATS placed=${stats.placed} optPlacement=${stats.optPlacement}` +
        ` placementPercent=${stats.overallPlacementPercent}` +
        ` totalCompanies=${stats.totalCompanies}` +
        ` medianCtc=${(ctcStats.median / 100000).toFixed(2)}`
      );

      if (renderer === 'vector') {
        // ── Vector renderer (no native deps, pure PDFKit paths) ──────────────
        const { generateVectorPdf } = await import('./pdfkit-charts-report.js');
        spinner.start('Rendering vector PDF…');
        await generateVectorPdf(stats, ctcStats, records, offerRecords, outputPath, reportOpts);
        spinner.succeed(`PDF saved → ${path.resolve(outputPath)}`);

      } else {
        // ── PNG renderer (Chart.js + canvas native bindings) ─────────────────
        const withCharts = opts.charts !== false;
        const { generateCharts } = await import('./charts.js');
        const { generatePdf }    = await import('./pdf-generator.js');

        let charts = null;
        if (withCharts) {
          spinner.start('Generating charts…');
          charts = await generateCharts(stats, ctcStats, reportOpts);
          spinner.succeed('Charts generated (8 charts)');
        } else {
          console.log('  ⚡ Charts skipped (--no-charts)');
        }

        spinner.start('Rendering PDF report…');
        await generatePdf(stats, ctcStats, charts, outputPath, reportOpts);
        spinner.succeed(`PDF saved → ${path.resolve(outputPath)}`);
      }

      console.log('');
      console.log('✅ Report generated successfully!');
      console.log(`   📄 ${path.resolve(outputPath)}`);
      console.log('');

    } catch (err) {
      spinner.fail('Failed');
      console.error('\n❌ Error:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  });

program.parse();
