import { fetchReportsIndex } from '@/lib/reports';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let reports = [];
  try {
    reports = await fetchReportsIndex();
  } catch {
    // Reports branch may not exist yet — proceed with empty state
  }

  const latestReport = reports[0] ?? null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Placement Report Generator
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Shiv Nadar University Chennai · Batch 2025
        </p>
      </div>

      <DashboardClient latestReport={latestReport} />
    </div>
  );
}
