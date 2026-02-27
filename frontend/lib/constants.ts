export interface FlagDefinition {
  flag: string;
  label: string;
  description: string;
  group: 'additive' | 'advanced';
  defaultEnabled: boolean;
}

export const FLAG_DEFINITIONS: FlagDefinition[] = [
  {
    flag: '--sections',
    label: 'Section Breakdown',
    description: 'Show individual section breakdown (AIDS A/B, IOT A/B) instead of merged branches',
    group: 'additive',
    defaultEnabled: false,
  },
  {
    flag: '--gender',
    label: 'Gender Breakdown',
    description: 'Include gender-wise placement breakdown chart',
    group: 'additive',
    defaultEnabled: false,
  },
  {
    flag: '--companies',
    label: 'Company Analysis',
    description: 'Include company-wise breakdown page with detailed recruiter stats',
    group: 'additive',
    defaultEnabled: false,
  },
  {
    flag: '--ctc-brackets',
    label: 'CTC Brackets',
    description: 'Show CTC bracket distribution chart (0–6, 6–10, 10–20, 20+ LPA)',
    group: 'additive',
    defaultEnabled: false,
  },
  {
    flag: '--no-ctc',
    label: 'Hide CTC Page',
    description: 'Hide the CTC & offer type analysis page from the report',
    group: 'advanced',
    defaultEnabled: false,
  },
  {
    flag: '--no-timeline',
    label: 'Hide Timeline',
    description: 'Hide the month-by-month offer activity timeline',
    group: 'advanced',
    defaultEnabled: false,
  },
  {
    flag: '--no-charts',
    label: 'Skip Charts',
    description: 'Skip chart generation (faster, tables only)',
    group: 'advanced',
    defaultEnabled: false,
  },
];

export const FLAG_MAP = new Map(FLAG_DEFINITIONS.map((f) => [f.flag, f]));
