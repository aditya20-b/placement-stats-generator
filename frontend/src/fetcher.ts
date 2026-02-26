export async function fetchCsv(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(
          `Could not fetch data from Google Sheets after ${retries + 1} attempts.\n` +
          `URL: ${url}\n` +
          `Error: ${msg}\n` +
          `Check your internet connection and ensure the sheet is publicly accessible.`
        );
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Unreachable');
}
