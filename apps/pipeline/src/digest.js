import { db } from './clients.js';

// Housekeeping: a periodic engagement digest. It summarizes ingestion counts
// to the log so an operator skimming `make logs` sees a heartbeat. It is not
// part of the ingestion path.

const INTERVAL_MS = 60_000;

export async function runDigest() {
  for (;;) {
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
    try {
      const { rows } = await db.query(
        `select status, count(*)::int as n from documents group by status order by status`
      );
      const summary = rows.map((r) => `${r.status}=${r.n}`).join(' ') || 'no documents yet';
      console.log(`[digest] hourly-rollup tick — documents: ${summary}`);
    } catch (err) {
      console.error(`[digest] tick failed: ${err.message}`);
    }
  }
}
