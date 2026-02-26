import { fetchReportsIndex } from '@/lib/reports';
import { HistoryList } from '@/components/HistoryList';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  let reports = [];
  try {
    reports = await fetchReportsIndex();
  } catch {
    // Reports branch may not exist yet
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Report History</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {reports.length === 0
            ? 'No reports generated yet'
            : `${reports.length} report${reports.length === 1 ? '' : 's'} — newest first`}
        </p>
      </div>

      <HistoryList reports={reports} />
    </div>
  );
}
