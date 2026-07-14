import { ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { chunkText } from '@second-brain/shared/chunking';
import { embed, toSqlVector } from '@second-brain/shared/embedding';
import { waitFor } from '@second-brain/shared/wait';
import { db, sqs, queueUrl } from './clients.js';

// Chunker: documents-chunks → split text → embed each chunk → write to
// pgvector → mark the document processed. Re-processing a document replaces
// its chunks (idempotent).

export async function runChunker() {
  await waitFor('chunker: queue', () => queueUrl(process.env.QUEUE_CHUNKS));
  await waitFor('chunker: db', () => db.query('select 1'));
  const chunksUrl = await queueUrl(process.env.QUEUE_CHUNKS);
  console.log('[chunker] polling', process.env.QUEUE_CHUNKS);

  for (;;) {
    const { Messages } = await sqs.send(
      new ReceiveMessageCommand({ QueueUrl: chunksUrl, MaxNumberOfMessages: 3, WaitTimeSeconds: 10 })
    );
    for (const msg of Messages ?? []) {
      const { documentId, text } = JSON.parse(msg.Body);
      try {
        const { rows } = await db.query(`select org_id from documents where id = $1`, [documentId]);
        if (!rows[0]) throw new Error(`document ${documentId} not found`);
        const orgId = rows[0].org_id;

        const pieces = chunkText(text);
        const client = await db.connect();
        try {
          await client.query('begin');
          await client.query(`delete from chunks where document_id = $1`, [documentId]);
          for (let seq = 0; seq < pieces.length; seq++) {
            await client.query(
              `insert into chunks (document_id, org_id, seq, content, embedding)
               values ($1, $2, $3, $4, $5::vector)`,
              [documentId, orgId, seq, pieces[seq], toSqlVector(embed(pieces[seq]))]
            );
          }
          await client.query(
            `update documents set status = 'processed', processed_at = now(), error = null where id = $1`,
            [documentId]
          );
          await client.query('commit');
        } catch (err) {
          await client.query('rollback');
          throw err;
        } finally {
          client.release();
        }

        await sqs.send(new DeleteMessageCommand({ QueueUrl: chunksUrl, ReceiptHandle: msg.ReceiptHandle }));
        console.log(`[chunker] processed document ${documentId} (${pieces.length} chunks)`);
      } catch (err) {
        console.error(`[chunker] failed on ${documentId}: ${err.message}`);
        await db
          .query(`update documents set status = 'failed', error = $2 where id = $1`, [documentId, err.message])
          .catch(() => {});
      }
    }
  }
}
