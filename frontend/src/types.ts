export interface StudentRecord {
  regNo: string;
  rollNo: string;
  name: string;
  gender: string;
  cls: string;
  section: string;
  choice: string;
  status: string;
  companies: string[];
}

export interface BranchStats {
  label: string;
  totalStudents: number;
  optPlacement: number;
  placed: number;
  notPlaced: number;
  hold: number;
  dropped: number;
  internshipOnly: number;
  higherStudies: number;
  exempt: number;
  placementPercent: number;
  totalOffers: number;
  malePlaced: number;
  femalePlaced: number;
  maleOptPlacement: number;
  femaleOptPlacement: number;
  malePlacedPercent: number;
  femalePlacedPercent: number;
}

export interface CompanyStats {
  name: string;
  totalOffers: number;
  branchWise: Record<string, number>; // keyed by merged branch label (AIDS, IOT, CS)
}

export interface MonthlyOffer {
  label: string;   // e.g. "Jul '25"
  sortKey: string; // e.g. "2025-07" for chronological sort
  count: number;
}

export interface PlacementStats {
  totalCount: number;
  optPlacement: number;
  higherStudies: number;
  exempt: number;
  placed: number;
  notPlaced: number;
  hold: number;
  dropped: number;
  internshipOnly: number;
  overallPlacementPercent: number;
  totalOffers: number;
  totalCompanies: number;
  branches: BranchStats[];       // individual: AIDS A, AIDS B, IOT A, IOT B, CS
  mergedBranches: BranchStats[]; // merged: AIDS, IOT, CS
  companies: CompanyStats[];
  topRecruiters: CompanyStats[];
}

export type OfferType = 'Internship' | 'Regular' | 'Dream' | 'Marquee' | 'Super Dream';

export interface OfferRecord {
  rollNo: string;
  name: string;
  company: string;
  ctc: number;
  offerType: OfferType;
  offerDate: string; // "30-Jul-2025"
}

export interface CtcStats {
  count: number;
  highest: number;
  lowest: number;
  average: number;
  median: number;
  offerTypeBreakdown: Record<OfferType, number>;
  monthlyTimeline: MonthlyOffer[];
}

export interface ReportOptions {
  showSections:    boolean; // --sections     : AIDS A/B, IOT A/B individually (default: merged)
  showGender:      boolean; // --gender       : gender breakdown chart
  showCompanies:   boolean; // --companies    : company analysis page
  showCtc:         boolean; // --no-ctc       : hide CTC page (default: show)
  showTimeline:    boolean; // --no-timeline  : hide monthly timeline (default: show)
  showCtcBrackets: boolean; // --ctc-brackets : show CTC bracket distribution chart
}

export const DEFAULT_OPTIONS: ReportOptions = {
  showSections:    false,
  showGender:      false,
  showCompanies:   false,
  showCtc:         true,
  showTimeline:    true,
  showCtcBrackets: false,
};

export interface ChartBuffers {
  overallPie:        Buffer;
  branchBarMerged:   Buffer; // AIDS, IOT, CS
  branchBarSections: Buffer; // AIDS A, AIDS B, IOT A, IOT B, CS
  classStackedBar:   Buffer; // merged stacked horizontal bar
  genderGroupedBar:  Buffer; // male vs female placement %
  offerTypeBar:      Buffer;
  ctcBracketsBar:    Buffer; // CTC bracket distribution (placement offers only)
  topRecruitersHBar: Buffer;
  timeline:          Buffer;
}
