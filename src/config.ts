export const SPREADSHEET_ID = '1U2qXle0-70mWfAj9En_YoQJShbcI2fYY230kCGbLiXE';
export const MASTER_GID = '1878175017';
export const OFFER_DETAILS_GID = '208317160';

export function getSpreadsheetId(): string {
  return process.env.SPREADSHEET_ID ?? SPREADSHEET_ID;
}

function csvUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export const getMasterCsvUrl      = () => csvUrl(getSpreadsheetId(), MASTER_GID);
export const getOfferDetailsCsvUrl = () => csvUrl(getSpreadsheetId(), OFFER_DETAILS_GID);

export const BRANCH_ORDER = ['AIDS A', 'AIDS B', 'IOT A', 'IOT B', 'CS'];

// Merged view for upper-management display (A+B sections combined)
export const MERGED_BRANCH_ORDER = ['AIDS', 'IOT', 'CS'];

export const BRANCH_COLORS = [
  '#2563EB', // AIDS A - blue
  '#16A34A', // AIDS B - green
  '#EA580C', // IOT A  - orange
  '#DC2626', // IOT B  - red
  '#7C3AED', // CS     - purple
];

export const MERGED_BRANCH_COLORS = [
  '#2563EB', // AIDS - blue
  '#EA580C', // IOT  - orange
  '#7C3AED', // CS   - purple
];

export const OUTPUT_DIR = './output';
export const OUTPUT_FILENAME = 'placement-report.pdf';

export const INSTITUTION = 'Shiv Nadar University Chennai';
export const REPORT_TITLE = 'Placement Statistics Report';
