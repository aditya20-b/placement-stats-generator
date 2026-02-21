# Placement Report Generator

A CLI tool that reads raw placement data from Google Sheets and produces a polished, publicly shareable PDF report — aggregated statistics, charts, no individual student data exposed.

## How it works

Two Google Sheets tabs feed the pipeline: a master sheet with one row per student (branch, section, gender, choice, status, companies) and an offer details sheet with one row per offer (company, CTC, offer type, date). The tool fetches both as CSV, parses and aggregates everything locally, renders charts server-side, and writes a multi-page PDF.

Charts are rendered server-side via `chartjs-node-canvas`, which uses node-canvas C++ bindings to run Chart.js without a browser. The PDF is built programmatically with PDFKit — tables, layout, and chart images all drawn by hand.

## Report contents

- **Dashboard** — total students, opted, placed, placement %, higher studies, exempt, total offers, companies visited; overall placement pie chart
- **Branch analysis** — placement % bar chart (merged or per-section), optional gender-wise grouped bar chart
- **CTC & offers** — highest / lowest / average / median CTC, offer type distribution chart, optional CTC bracket chart
- **Recruiters & timeline** — top 10 recruiters horizontal bar, month-by-month offer activity
- **Company table** — full list of companies with offer counts broken down by branch (`--companies`)

## Requirements

- Node.js 20+

## Usage

```bash
npm install
npx tsx src/index.ts
```

Output is saved to `output/placement-report.pdf` by default.

## Flags

| Flag | Description |
|---|---|
| `-o, --output <path>` | Custom output path for the PDF |
| `--no-charts` | Skip chart generation (faster, tables only) |
| `--sections` | Show individual section breakdown (AIDS A/B, IOT A/B) instead of merged branches |
| `--gender` | Include gender-wise placement breakdown chart |
| `--companies` | Include full company-wise offer table |
| `--no-ctc` | Hide the CTC & offer type analysis page |
| `--no-timeline` | Hide the month-by-month offer activity timeline |
| `--ctc-brackets` | Show CTC bracket distribution chart (0–6, 6–10, 10–20, 20+ LPA) |

## Data source

Sheet IDs and GIDs are configured in `src/config.ts`. The tool reads from two tabs:

- **Master sheet** — one row per student: reg number, name, gender, branch, section, placement choice, status, companies (comma-separated in a single cell)
- **Offer details sheet** — one row per offer: roll number, name, company, CTC, offer type, offer date
