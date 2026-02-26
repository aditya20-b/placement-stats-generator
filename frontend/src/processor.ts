import type { StudentRecord, BranchStats, CompanyStats, PlacementStats, OfferRecord, CtcStats, OfferType, MonthlyOffer } from './types';
import { BRANCH_ORDER, MERGED_BRANCH_ORDER } from './config';

function branchLabel(cls: string, section: string): string {
  const c = cls.trim();
  const s = section.trim();
  if (!s || s === '-') return c;
  return `${c} ${s}`;
}

function computeBranchStats(records: StudentRecord[], label: string, matchFn: (r: StudentRecord) => boolean): BranchStats {
  const branchRecords = records.filter(matchFn);
  const branchOpt    = branchRecords.filter(r => r.choice === 'Placement');
  const branchPlaced = branchRecords.filter(r => r.status === 'Placed');

  const malePlaced         = branchPlaced.filter(r => r.gender === 'Male').length;
  const femalePlaced       = branchPlaced.filter(r => r.gender === 'Female').length;
  const maleOptPlacement   = branchOpt.filter(r => r.gender === 'Male').length;
  const femaleOptPlacement = branchOpt.filter(r => r.gender === 'Female').length;
  const branchPlacedCount  = branchPlaced.length;
  const branchOptCount     = branchOpt.length;

  return {
    label,
    totalStudents:       branchRecords.length,
    optPlacement:        branchOptCount,
    placed:              branchPlacedCount,
    notPlaced:           branchRecords.filter(r => r.status === 'Not Placed').length,
    hold:                branchRecords.filter(r => r.status === 'Hold').length,
    dropped:             branchRecords.filter(r => r.status === 'Dropped').length,
    internshipOnly:      branchRecords.filter(r => r.status === 'Internship Only').length,
    higherStudies:       branchRecords.filter(r => r.choice === 'Higher Studies').length,
    exempt:              branchRecords.filter(r => r.choice === 'Placement Exempt').length,
    placementPercent:    branchOptCount > 0
      ? Math.round((branchPlacedCount / branchOptCount) * 1000) / 10
      : 0,
    totalOffers:         branchRecords.reduce((s, r) => s + r.companies.length, 0),
    malePlaced,
    femalePlaced,
    maleOptPlacement,
    femaleOptPlacement,
    malePlacedPercent:   maleOptPlacement > 0 ? Math.round((malePlaced / maleOptPlacement) * 1000) / 10 : 0,
    femalePlacedPercent: femaleOptPlacement > 0 ? Math.round((femalePlaced / femaleOptPlacement) * 1000) / 10 : 0,
  };
}

export function computeStats(records: StudentRecord[]): PlacementStats {
  const totalCount    = records.length;
  const optPlacement  = records.filter(r => r.choice === 'Placement').length;
  const higherStudies = records.filter(r => r.choice === 'Higher Studies').length;
  const exempt        = records.filter(r => r.choice === 'Placement Exempt').length;
  const placed        = records.filter(r => r.status === 'Placed').length;
  const notPlaced     = records.filter(r => r.status === 'Not Placed').length;
  const hold          = records.filter(r => r.status === 'Hold').length;
  const dropped       = records.filter(r => r.status === 'Dropped').length;
  const internshipOnly = records.filter(r => r.status === 'Internship Only').length;
  const totalOffers   = records.reduce((sum, r) => sum + r.companies.length, 0);

  const overallPlacementPercent = optPlacement > 0
    ? Math.round((placed / optPlacement) * 1000) / 10
    : 0;

  // Individual branches (AIDS A, AIDS B, IOT A, IOT B, CS)
  const branches: BranchStats[] = BRANCH_ORDER.map(label =>
    computeBranchStats(records, label, r => branchLabel(r.cls, r.section) === label)
  );

  // Merged branches (AIDS = A+B, IOT = A+B, CS)
  const mergedBranches: BranchStats[] = MERGED_BRANCH_ORDER.map(label =>
    computeBranchStats(records, label, r => r.cls.trim() === label)
  );

  // Company stats keyed by MERGED branch label (AIDS, IOT, CS)
  // Special case: "Citibank PPO" is treated as "Citibank" for aggregation
  const companyMap = new Map<string, CompanyStats>();
  for (const record of records) {
    const mergedLabel = record.cls.trim(); // AIDS, IOT, CS
    for (const rawCompany of record.companies) {
      if (!rawCompany) continue;
      const company = rawCompany.trim() === 'Citibank PPO' ? 'Citibank' : rawCompany.trim();
      if (!companyMap.has(company)) {
        companyMap.set(company, { name: company, totalOffers: 0, branchWise: {} });
      }
      const cs = companyMap.get(company)!;
      cs.totalOffers++;
      cs.branchWise[mergedLabel] = (cs.branchWise[mergedLabel] ?? 0) + 1;
    }
  }

  const companies    = Array.from(companyMap.values()).sort((a, b) => b.totalOffers - a.totalOffers);
  const topRecruiters = companies.slice(0, 10);

  return {
    totalCount, optPlacement, higherStudies, exempt,
    placed, notPlaced, hold, dropped, internshipOnly,
    overallPlacementPercent, totalOffers,
    totalCompanies: companies.length,
    branches, mergedBranches, companies, topRecruiters,
  };
}

// Month abbreviation -> zero-padded number for sort keys
const MONTH_NUM: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

function parseMonthKey(dateStr: string): { label: string; sortKey: string } | null {
  // Format: "30-Jul-2025" or "4-Aug-2025"
  const parts = dateStr.trim().split('-');
  if (parts.length < 3) return null;
  const mon = parts[1];
  const yr  = parts[2];
  const num = MONTH_NUM[mon];
  if (!num || !yr) return null;
  return {
    label:   `${mon} '${yr.slice(2)}`,  // "Jul '25"
    sortKey: `${yr}-${num}`,             // "2025-07"
  };
}

export function computeCtcStats(offers: OfferRecord[]): CtcStats {
  // Exclude internship stipends from CTC stats — only actual placement offers
  const placementOffers = offers.filter(o => o.offerType !== 'Internship');
  const ctcs = placementOffers.map(o => o.ctc).filter(c => c > 0).sort((a, b) => a - b);
  const count = ctcs.length;

  const highest = ctcs[count - 1] ?? 0;
  const lowest  = ctcs[0] ?? 0;
  const average = count > 0 ? Math.round(ctcs.reduce((s, c) => s + c, 0) / count) : 0;
  const median  = count > 0
    ? count % 2 === 0
      ? Math.round((ctcs[count / 2 - 1] + ctcs[count / 2]) / 2)
      : ctcs[Math.floor(count / 2)]
    : 0;

  const offerTypeBreakdown: Record<OfferType, number> = {
    'Internship': 0, 'Regular': 0, 'Dream': 0, 'Marquee': 0, 'Super Dream': 0,
  };
  for (const o of offers) {
    offerTypeBreakdown[o.offerType] = (offerTypeBreakdown[o.offerType] ?? 0) + 1;
  }

  // Month-by-month timeline (all offers including internships)
  const monthMap = new Map<string, MonthlyOffer>();
  for (const o of offers) {
    const parsed = parseMonthKey(o.offerDate);
    if (!parsed) continue;
    if (!monthMap.has(parsed.sortKey)) {
      monthMap.set(parsed.sortKey, { label: parsed.label, sortKey: parsed.sortKey, count: 0 });
    }
    monthMap.get(parsed.sortKey)!.count++;
  }
  const monthlyTimeline = Array.from(monthMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return { count, highest, lowest, average, median, offerTypeBreakdown, monthlyTimeline };
}
