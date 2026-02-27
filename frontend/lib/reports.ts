import type { ReportEntry } from '@/types/report';

const OWNER = process.env.GITHUB_REPO_OWNER!;
const REPO = process.env.GITHUB_REPO_NAME!;
const PAT = process.env.GITHUB_PAT!;

export function getPdfDownloadUrl(filename: string): string {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/reports/${filename}`;
}

export async function fetchReportsIndex(): Promise<ReportEntry[]> {
  // Use the Contents API instead of raw.githubusercontent.com — the raw URL
  // is served via GitHub's CDN and can be stale for several minutes regardless
  // of cache headers. The Contents API is always fresh.
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/index.json?ref=reports`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${PAT}`,
      Accept: 'application/vnd.github.raw+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`Failed to fetch reports index: ${res.status}`);

  return res.json() as Promise<ReportEntry[]>;
}
