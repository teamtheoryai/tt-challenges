import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { randomUUID } from 'node:crypto';
import { pool, asUser } from './db.js';
import { s3, sqs, queueUrl, BUCKET } from './aws.js';
import { systemStatus } from './status.js';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true, service: 'api' }));

// ── Auth (sandbox-grade, deliberately) ─────────────────────────────────────
// The browser sends x-user-id; the database enforces what that user can see.
// There is no password layer in the box — isolation lives in RLS, not here.
async function currentUser(c) {
  const id = Number(c.req.header('x-user-id'));
  if (!id) return null;
  const { rows } = await pool.query(
    `select u.id, u.email, u.name, u.role, u.org_id, o.slug as org_slug, o.kind as org_kind
     from users u join orgs o on o.id = u.org_id where u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

const requireUser = async (c, next) => {
  const user = await currentUser(c);
  if (!user) return c.json({ error: 'unauthenticated — send x-user-id' }, 401);
  c.set('user', user);
  await next();
};

// ── Session / directory ────────────────────────────────────────────────────
app.get('/api/users', async (c) => {
  const { rows } = await pool.query(
    `select u.id, u.name, u.role, o.name as org_name from users u join orgs o on o.id = u.org_id order by u.id`
  );
  return c.json(rows);
});

app.get('/api/me', requireUser, (c) => c.json(c.get('user')));

app.get('/api/orgs', requireUser, async (c) => {
  const user = c.get('user');
  const rows = await asUser(user.id, async (db) => {
    const { rows } = await db.query(
      `select o.id, o.slug, o.name, o.kind,
              (select count(*) from documents d where d.org_id = o.id) as document_count,
              (select count(*) from documents d where d.org_id = o.id and d.status = 'processed') as processed_count,
              (select count(*) from executives e where e.org_id = o.id) as executive_count
       from orgs o
       where o.id in (select app_visible_orgs())
       order by o.id`
    );
    return rows;
  });
  return c.json(rows);
});

// ── Status ─────────────────────────────────────────────────────────────────
app.get('/api/status', async (c) => c.json(await systemStatus()));

// ── Documents ──────────────────────────────────────────────────────────────
app.get('/api/documents', requireUser, async (c) => {
  const user = c.get('user');
  const orgId = c.req.query('orgId');
  const rows = await asUser(user.id, async (db) => {
    const { rows } = await db.query(
      `select d.id, d.org_id, o.slug as org_slug, d.title, d.status, d.error,
              d.uploaded_at, d.processed_at,
              (select count(*) from chunks ch where ch.document_id = d.id) as chunk_count
       from documents d join orgs o on o.id = d.org_id
       where ($1::int is null or d.org_id = $1::int)
       order by d.uploaded_at desc`,
      [orgId || null]
    );
    return rows;
  });
  return c.json(rows);
});

app.post('/api/documents', requireUser, async (c) => {
  const user = c.get('user');
  const form = await c.req.formData();
  const file = form.get('file');
  const orgId = Number(form.get('orgId'));
  if (!file || typeof file === 'string' || !orgId) {
    return c.json({ error: 'expected multipart form with `file` and `orgId`' }, 400);
  }

  const body = Buffer.from(await file.arrayBuffer());
  const key = `org-${orgId}/${randomUUID()}/${file.name}`;

  return await asUser(user.id, async (db) => {
    // RLS checks the insert first — no upload lands for an org the user can't see.
    let doc;
    try {
      const { rows } = await db.query(
        `insert into documents (org_id, title, s3_key, content_type, uploaded_by)
         values ($1, $2, $3, $4, $5)
         returning id, title, status, uploaded_at`,
        [orgId, file.name, key, file.type || 'text/markdown', user.id]
      );
      doc = rows[0];
    } catch (err) {
      if (err.code === '42501') return c.json({ error: 'not allowed for that org' }, 403);
      throw err;
    }

    await s3.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: file.type || 'text/markdown' })
    );
    await sqs.send(
      new SendMessageCommand({
        QueueUrl: await queueUrl(process.env.QUEUE_INBOX),
        MessageBody: JSON.stringify({ documentId: doc.id, s3Key: key, orgId }),
      })
    );
    return c.json(doc, 201);
  });
});

// ── Ask the brain ──────────────────────────────────────────────────────────
app.post('/api/ask', requireUser, async (c) => {
  const user = c.get('user');
  const { question } = await c.req.json();
  const res = await fetch(`${process.env.AGENT_URL}/answer`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, userId: user.id }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    return c.json({ error: `agent responded ${res.status}: ${await res.text()}` }, 502);
  }
  return c.json(await res.json());
});

// ── Talent review ──────────────────────────────────────────────────────────
app.get('/api/talent-review', requireUser, async (c) => {
  const user = c.get('user');
  const rows = await asUser(user.id, async (db) => {
    const { rows } = await db.query(
      `select e.id, e.name, e.title, e.org_id, o.slug as org_slug, o.name as org_name,
              coalesce(json_agg(json_build_object(
                'dimension', s.dimension, 'score', s.score, 'rationale', s.rationale
              ) order by s.dimension) filter (where s.id is not null), '[]') as scores
       from executives e
       join orgs o on o.id = e.org_id
       left join scores s on s.executive_id = e.id
       group by e.id, o.slug, o.name
       order by e.org_id, e.id`
    );
    return rows;
  });
  return c.json(rows);
});

app.get('/api/executives/:id', requireUser, async (c) => {
  const user = c.get('user');
  const execId = Number(c.req.param('id'));
  const result = await asUser(user.id, async (db) => {
    const exec = await db.query(
      `select e.id, e.name, e.title, o.name as org_name, o.slug as org_slug
       from executives e join orgs o on o.id = e.org_id where e.id = $1`,
      [execId]
    );
    if (!exec.rows[0]) return null;
    const scores = await db.query(
      `select s.id, s.dimension, s.score, s.rationale,
              coalesce(json_agg(json_build_object(
                'sourceType', ss.source_type, 'documentRef', ss.document_ref,
                'note', ss.note, 'weight', ss.weight
              ) order by ss.weight desc) filter (where ss.id is not null), '[]') as sources
       from scores s
       left join score_sources ss on ss.score_id = s.id
       where s.executive_id = $1
       group by s.id
       order by s.dimension`,
      [execId]
    );
    return { ...exec.rows[0], scores: scores.rows };
  });
  if (!result) return c.json({ error: 'not found' }, 404);
  return c.json(result);
});

const port = 4000;
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`[api] listening on :${port}`);
});
