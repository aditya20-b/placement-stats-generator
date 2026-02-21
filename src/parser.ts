import Papa from 'papaparse';
import type { StudentRecord, OfferRecord, OfferType } from './types.js';

const VALID_OFFER_TYPES: OfferType[] = ['Internship', 'Regular', 'Dream', 'Marquee', 'Super Dream'];

function parseCtc(raw: string): number {
  // "12,00,000" or "1,00,00,000" -> strip commas, parse int
  return parseInt(raw.replace(/,/g, '').replace(/[^\d]/g, ''), 10) || 0;
}

export function parseOfferDetails(csvText: string): OfferRecord[] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  const rows = result.data;
  // Header row: Roll Number, Name, Company (Offer Detail), CTC / Stipend, Offer Type, Offer Date
  const records: OfferRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 5) continue;

    const rollNo    = (row[0] ?? '').trim();
    const name      = (row[1] ?? '').trim();
    const company   = (row[2] ?? '').trim();
    const ctcRaw    = (row[3] ?? '').trim();
    const typeRaw   = (row[4] ?? '').trim() as OfferType;
    const offerDate = (row[5] ?? '').trim();

    if (!rollNo && !name) continue;
    if (!company) continue;

    const offerType = VALID_OFFER_TYPES.includes(typeRaw) ? typeRaw : 'Regular';

    records.push({ rollNo, name, company, ctc: parseCtc(ctcRaw), offerType, offerDate });
  }

  return records;
}

export function parseMasterSheet(csvText: string): StudentRecord[] {
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0) {
    const firstErr = result.errors[0];
    throw new Error(`CSV parse error at row ${firstErr.row}: ${firstErr.message}`);
  }

  const rows = result.data;
  if (rows.length < 2) {
    throw new Error('No student records found in the spreadsheet.');
  }

  // Skip header row (row 0). Data rows have these columns by index:
  // 0 = serial/index, 1 = RegNo, 2 = Name, 3 = Gender,
  // 4 = Class, 5 = Section, 6 = Choice, 7 = Status, 8 = Company
  const records: StudentRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 7) continue;

    const regNo   = (row[1] ?? '').trim();
    const name    = (row[2] ?? '').trim();
    if (!regNo && !name) continue; // completely empty row

    const gender  = (row[3] ?? '').trim();
    const cls     = (row[4] ?? '').trim();
    const section = (row[5] ?? '').trim();
    const choice  = (row[6] ?? '').trim();
    const status  = (row[7] ?? '').trim();
    const companyRaw = (row[8] ?? '').trim();

    // Split comma-separated companies; papaparse already handles the outer quotes
    const companies = companyRaw
      ? companyRaw.split(',').map(c => c.trim()).filter(Boolean)
      : [];

    records.push({
      regNo,
      rollNo: (row[0] ?? '').trim(),
      name,
      gender,
      cls,
      section,
      choice,
      status,
      companies,
    });
  }

  if (records.length === 0) {
    throw new Error('No valid student records found after parsing.');
  }

  return records;
}
