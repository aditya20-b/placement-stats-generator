const OWNER = process.env.GITHUB_REPO_OWNER!;
const REPO = process.env.GITHUB_REPO_NAME!;
const WORKFLOW_ID = process.env.GITHUB_WORKFLOW_ID!;
const PAT = process.env.GITHUB_PAT!;

const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

function ghHeaders() {
  return {
    Authorization: `Bearer ${PAT}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function triggerWorkflow(
  flags: string[],
  spreadsheetId?: string
): Promise<number> {
  const beforeDispatch = new Date().toISOString();

  const res = await fetch(
    `${BASE}/actions/workflows/${WORKFLOW_ID}/dispatches`,
    {
      method: 'POST',
      headers: ghHeaders(),
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          flags: flags.join(' '),
          spreadsheet_id: spreadsheetId ?? '',
        },
      }),
    }
  );

  if (res.status !== 204) {
    const body = await res.text();
    throw new Error(`GitHub dispatch failed: ${res.status} ${body}`);
  }

  // Poll for the new run ID
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const runsRes = await fetch(
      `${BASE}/actions/runs?per_page=5&event=workflow_dispatch`,
      { headers: ghHeaders() }
    );
    if (!runsRes.ok) continue;

    const data = (await runsRes.json()) as {
      workflow_runs: Array<{ id: number; created_at: string; name: string }>;
    };

    const run = data.workflow_runs.find(
      (r) => new Date(r.created_at) >= new Date(beforeDispatch)
    );
    if (run) return run.id;
  }

  throw new Error('Could not determine workflow run ID after dispatch');
}

export async function getWorkflowRunStatus(
  runId: number
): Promise<{ status: string; conclusion: string | null }> {
  const res = await fetch(`${BASE}/actions/runs/${runId}`, {
    headers: ghHeaders(),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`GitHub runs API failed: ${res.status}`);

  const data = (await res.json()) as {
    status: string;
    conclusion: string | null;
  };
  return { status: data.status, conclusion: data.conclusion };
}
