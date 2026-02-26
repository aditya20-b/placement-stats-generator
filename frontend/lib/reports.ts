import type { ReportEntry } from '@/types/report';

const OWNER = process.env.GITHUB_REPO_OWNER!;
const REPO = process.env.GITHUB_REPO_NAME!;
const PAT = process.env.GITHUB_PAT!;

export function getReportsIndexUrl(): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/reports/index.json`;
}

export function getPdfDownloadUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/reports/${filename}`;
}

export async function fetchReportsIndex(): Promise<ReportEntry[]> {
  const url = getReportsIndexUrl();
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${PAT}`,
    },
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch reports index: ${res.status}`);

  return res.json() as Promise<ReportEntry[]>;
}
