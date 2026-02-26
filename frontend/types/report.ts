export interface ReportStats {
  placed: number;
  optPlacement: number;
  placementPercent: string;
  totalCompanies: number;
  medianCtc: string;
}

export interface ReportEntry {
  id: string;
  timestamp: string;
  filename: string;
  flags: string[];
  spreadsheetId: string | null;
  stats: ReportStats;
}
