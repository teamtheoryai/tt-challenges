import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { adminPool } from './db.js';
import { s3, sqs, queueUrl, BUCKET } from './aws.js';

// The System Status readout: symptoms, never causes. Each probe reports what
// it can see from the outside — health, depths, timestamps — and nothing more.

async function probe(fn) {
  try {
    const detail = (await fn()) ?? {};
    return { ok: true, ...detail };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const QUEUES = ['documents-inbox', 'documents-inbox-dlq', 'documents-chunks', 'documents-chunks-dlq'];

export async function systemStatus() {
  const [db, storage, agent, ...queues] = await Promise.all([
    probe(async () => {
      // Runs on the system pool: the status panel is an org-agnostic ops view,
      // so it counts documents across all orgs (RLS applies to user queries,
      // not to this readout).
      const { rows } = await adminPool.query(
        `select
           count(*) filter (where status = 'processed')  as processed,
           count(*) filter (where status = 'processing') as processing,
           count(*) filter (where status = 'uploaded')   as queued,
           count(*) filter (where status = 'failed')     as failed,
           max(processed_at)                             as last_processed_at
         from documents`
      );
      return { documents: rows[0] };
    }),
    probe(async () => {
      await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
      return { bucket: BUCKET };
    }),
    probe(async () => {
      const res = await fetch(`${process.env.AGENT_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error(`agent responded ${res.status}`);
      return await res.json();
    }),
    ...QUEUES.map((name) =>
      probe(async () => {
        const url = await queueUrl(name);
        const { Attributes } = await sqs.send(
          new GetQueueAttributesCommand({
            QueueUrl: url,
            AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
          })
        );
        return {
          name,
          depth: Number(Attributes?.ApproximateNumberOfMessages ?? 0),
          inFlight: Number(Attributes?.ApproximateNumberOfMessagesNotVisible ?? 0),
        };
      })
    ),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    db,
    storage,
    agent,
    queues,
  };
}
