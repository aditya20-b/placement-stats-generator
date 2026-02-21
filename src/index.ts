#!/usr/bin/env node
import { Command } from 'commander';
import ora from 'ora';
import path from 'path';
import { fetchCsv } from './fetcher.js';
import { parseMasterSheet, parseOfferDetails } from './parser.js';
import { computeStats, computeCtcStats } from './processor.js';
import { generateCharts } from './charts.js';
import { generatePdf } from './pdf-generator.js';
import { getMasterCsvUrl, getOfferDetailsCsvUrl, OUTPUT_DIR, OUTPUT_FILENAME } from './config.js';
import type { ReportOptions } from './types.js';

const program = new Command();

program
  .name('placement-stats')
  .description('Generate a placement statistics PDF report from Google Sheets data')
  .version('1.0.0')
  .option('-o, --output <path>', 'Output PDF file path', path.join(OUTPUT_DIR, OUTPUT_FILENAME))
  .option('--no-charts', 'Skip chart generation (faster, tables only)')
  .option('--sections', 'Show individual section breakdown (AIDS A/B, IOT A/B) instead of merged branches')
  .option('--gender', 'Include gender-wise placement breakdown chart')
  .option('--companies', 'Include company-wise breakdown page')
  .option('--no-ctc', 'Hide CTC & offer type analysis page')
  .option('--no-timeline', 'Hide month-by-month offer activity timeline')
  .option('--ctc-brackets', 'Show CTC bracket distribution chart (0–6, 6–10, 10–20, 20+ LPA)')
  .action(async (opts) => {
    const outputPath: string  = opts.output;
    const withCharts: boolean = opts.charts !== false;

    const reportOpts: ReportOptions = {
      showSections:    !!opts.sections,
      showGender:      !!opts.gender,
      showCompanies:   !!opts.companies,
      showCtc:         opts.ctc !== false,
      showTimeline:    opts.timeline !== false,
      showCtcBrackets: !!opts.ctcBrackets,
    };

    console.log('');

    const spinner = ora({ color: 'blue' });

    try {
      // Step 1: Fetch both sheets in parallel
      spinner.start('Fetching data from Google Sheets…');
      const [masterCsv, offerCsv] = await Promise.all([
        fetchCsv(getMasterCsvUrl()),
        fetchCsv(getOfferDetailsCsvUrl()),
      ]);
      spinner.succeed(
        `Data fetched — Master: ${(masterCsv.length / 1024).toFixed(1)} KB, ` +
        `Offers: ${(offerCsv.length / 1024).toFixed(1)} KB`
      );

      // Step 2: Parse
      spinner.start('Parsing records…');
      const records = parseMasterSheet(masterCsv);
      const offerRecords = parseOfferDetails(offerCsv);
      spinner.succeed(`Parsed ${records.length} students, ${offerRecords.length} offer records`);

      // Step 3: Compute
      spinner.start('Computing placement statistics…');
      const stats    = computeStats(records);
      const ctcStats = computeCtcStats(offerRecords);
      spinner.succeed(
        `Stats computed — ${stats.placed}/${stats.optPlacement} placed ` +
        `(${stats.overallPlacementPercent}%) | Median CTC: ₹${(ctcStats.median / 100000).toFixed(2)}L`
      );

      // Step 4: Charts
      let charts = null;
      if (withCharts) {
        spinner.start('Generating charts…');
        charts = await generateCharts(stats, ctcStats);
        spinner.succeed('Charts generated (8 charts)');
      } else {
        console.log('  ⚡ Charts skipped (--no-charts)');
      }

      // Step 5: PDF
      spinner.start('Rendering PDF report…');
      await generatePdf(stats, ctcStats, charts, outputPath, reportOpts);
      spinner.succeed(`PDF saved → ${path.resolve(outputPath)}`);

      console.log('');
      console.log('✅ Report generated successfully!');
      console.log(`   📄 ${path.resolve(outputPath)}`);
      console.log('');

    } catch (err) {
      spinner.fail('Failed');
      const msg = err instanceof Error ? err.message : String(err);
      console.error('\n❌ Error:', msg);
      process.exit(1);
    }
  });

program.parse();
