// One-shot corpus seeder. On first boot it pushes every markdown document in
// data/ through the REAL ingestion path (S3 → queue → reader → chunker), so
// the box starts with earned pipeline state, not faked rows. Subsequent boots
// no-op (system_flags.corpus_seeded).

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueUrlCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { waitFor } from '@second-brain/shared/wait';

const DATA_ROOT = '/repo/data';
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL_ADMIN, max: 2 });
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
});
const sqs = new SQSClient({
  endpoint: process.env.SQS_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'office') continue; // binaries are out of scope for ingestion
      yield* walk(path);
    } else if (/\.md$/i.test(entry.name)) {
      yield path;
    }
  }
}

function orgSlugFor(relPath) {
  const m = relPath.match(/^portcos\/(PC\d)\//i);
  if (m) return m[1].toLowerCase();
  if (relPath.startsWith('fund/')) return 'daw';
  return null;
}

async function main() {
  await waitFor('seeder: db', () => db.query('select 1'));
  await waitFor('seeder: bucket', () => s3.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET })));
  await waitFor('seeder: queue', () => sqs.send(new GetQueueUrlCommand({ QueueName: process.env.QUEUE_INBOX })));

  const seeded = await db.query(`select 1 from system_flags where key = 'corpus_seeded'`);
  if (seeded.rows.length) {
    console.log('[seeder] corpus already seeded — nothing to do');
    return;
  }

  const orgs = Object.fromEntries(
    (await db.query(`select slug, id from orgs`)).rows.map((r) => [r.slug, r.id])
  );
  const uploader = (await db.query(`select id from users where email like 'alex.rivera@%'`)).rows[0]?.id ?? null;
  const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: process.env.QUEUE_INBOX }));

  let count = 0;
  for await (const path of walk(DATA_ROOT)) {
    const relPath = relative(DATA_ROOT, path);
    const slug = orgSlugFor(relPath);
    if (!slug || !orgs[slug]) continue;
    const orgId = orgs[slug];
    const title = relPath.split('/').pop();
    const key = `org-${orgId}/${randomUUID()}/${title}`;
    const body = await readFile(path);

    await s3.send(
      new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: body, ContentType: 'text/markdown' })
    );
    const { rows } = await db.query(
      `insert into documents (org_id, title, s3_key, uploaded_by) values ($1, $2, $3, $4) returning id`,
      [orgId, title, key, uploader]
    );
    await sqs.send(
      new SendMessageCommand({
        QueueUrl,
        MessageBody: JSON.stringify({ documentId: rows[0].id, s3Key: key, orgId }),
      })
    );
    count++;
  }

  await db.query(`insert into system_flags (key, value) values ('corpus_seeded', $1)`, [String(count)]);
  console.log(`[seeder] enqueued ${count} corpus documents — the pipeline takes it from here`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seeder] failed:', err);
    process.exit(1);
  });
