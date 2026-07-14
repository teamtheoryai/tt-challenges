// The document pipeline: two queue workers plus a background housekeeping job.
//
//   documents-inbox  → reader  (fetch from S3, extract text)
//   documents-chunks → chunker (split, embed, write to pgvector, mark processed)
//
// Failed messages redrive to the matching DLQ after 3 receives (declared in
// infra/elasticmq/elasticmq.conf).

import { runReader } from './reader.js';
import { runChunker } from './chunker.js';
import { runDigest } from './digest.js';

console.log('[pipeline] starting workers: reader, chunker, digest');

await Promise.all([
  runReader().catch((err) => {
    console.error('[reader] fatal:', err);
    process.exit(1);
  }),
  runChunker().catch((err) => {
    console.error('[chunker] fatal:', err);
    process.exit(1);
  }),
  runDigest().catch((err) => {
    console.error('[digest] fatal:', err);
    // Housekeeping is not load-bearing for ingestion — keep the workers up.
  }),
]);
