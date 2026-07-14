import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueUrlCommand } from '@aws-sdk/client-sqs';

// Local S3 (MinIO) and SQS (ElasticMQ). Same SDK as production.
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

const queueUrlCache = new Map();

export async function queueUrl(name) {
  if (!queueUrlCache.has(name)) {
    const { QueueUrl } = await sqs.send(new GetQueueUrlCommand({ QueueName: name }));
    queueUrlCache.set(name, QueueUrl);
  }
  return queueUrlCache.get(name);
}

export const BUCKET = process.env.S3_BUCKET || 'uploads';
