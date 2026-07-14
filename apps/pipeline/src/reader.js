import { GetObjectCommand } from '@aws-sdk/client-s3';
import { ReceiveMessageCommand, DeleteMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs';
import { waitFor } from '@second-brain/shared/wait';
import { db, s3, sqs, queueUrl, BUCKET } from './clients.js';

// Reader: documents-inbox → fetch the object from S3 → extract text →
// hand off to the chunk queue. Markdown and plain text pass through as-is.

function extractText(body, contentType, key) {
  if (/\.(md|markdown|txt)$/i.test(key) || /text\/(markdown|plain)/.test(contentType ?? '')) {
    return body.toString('utf8');
  }
  // Unknown binary types are out of scope for the box — fail loudly so the
  // document lands in `failed` with a readable error, not silence.
  throw new Error(`unsupported content type for ${key} — the box ingests .md/.txt`);
}

export async function runReader() {
  await waitFor('reader: queue', () => queueUrl(process.env.QUEUE_INBOX));
  await waitFor('reader: db', () => db.query('select 1'));
  const inboxUrl = await queueUrl(process.env.QUEUE_INBOX);
  const chunksUrl = await queueUrl(process.env.QUEUE_CHUNKS);
  console.log('[reader] polling', process.env.QUEUE_INBOX);

  for (;;) {
    const { Messages } = await sqs.send(
      new ReceiveMessageCommand({ QueueUrl: inboxUrl, MaxNumberOfMessages: 5, WaitTimeSeconds: 10 })
    );
    for (const msg of Messages ?? []) {
      const { documentId, s3Key } = JSON.parse(msg.Body);
      try {
        await db.query(`update documents set status = 'processing', error = null where id = $1`, [documentId]);

        const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: s3Key }));
        const body = Buffer.from(await obj.Body.transformToByteArray());
        const text = extractText(body, obj.ContentType, s3Key);

        await sqs.send(
          new SendMessageCommand({
            QueueUrl: chunksUrl,
            MessageBody: JSON.stringify({ documentId, text }),
          })
        );
        await sqs.send(new DeleteMessageCommand({ QueueUrl: inboxUrl, ReceiptHandle: msg.ReceiptHandle }));
        console.log(`[reader] extracted ${s3Key} (${text.length} chars)`);
      } catch (err) {
        // Leave the message un-deleted: it retries, then redrives to the DLQ.
        console.error(`[reader] failed on ${s3Key}: ${err.message}`);
        await db
          .query(`update documents set status = 'failed', error = $2 where id = $1`, [documentId, err.message])
          .catch(() => {});
      }
    }
  }
}
