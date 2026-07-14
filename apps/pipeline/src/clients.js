import pg from 'pg';
import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueUrlCommand } from '@aws-sdk/client-sqs';

// The pipeline is a system writer: it connects as the schema owner (it must
// write chunks for every org), and reads S3 with its own least-privilege
// service account (pipeline-svc — see infra/minio/pipeline-policy.json).
export const db = new pg.Pool({ connectionString: process.env.DATABASE_URL_ADMIN, max: 5 });

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export const sqs = new SQSClient({
  endpoint: process.env.SQS_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
});

const cache = new Map();
export async function queueUrl(name) {
  if (!cache.has(name)) {
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: name }));
    cache.set(name, QueueUrl);
  }
  return cache.get(name);
}

export const BUCKET = process.env.S3_BUCKET || 'uploads';
