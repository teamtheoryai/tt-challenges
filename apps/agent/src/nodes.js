import pg from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { embed, toSqlVector } from '@second-brain/shared/embedding';

// The agent reads through the same RLS boundary as the API: queries run as
// app_user with app.user_id set, so retrieval can only surface chunks the
// asking user is allowed to see.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

async function asUser(userId, fn) {
  const client = await pool.connect();
  try {
    await client.query(`select set_config('app.user_id', $1, false)`, [String(userId ?? '')]);
    return await fn(client);
  } finally {
    await client.query(`select set_config('app.user_id', '', false)`).catch(() => {});
    client.release();
  }
}

// ── Node: prepare ───────────────────────────────────────────────────────────
export async function prepare(state) {
  return { question: (state.question ?? '').trim() };
}

// Router after prepare: an empty question has nothing to retrieve for.
export function routeAfterPrepare(state) {
  return state.question ? 'retrieve' : 'answer';
}

// ── Node: retrieve ──────────────────────────────────────────────────────────
export async function retrieve(state) {
  const queryVec = toSqlVector(embed(state.question));
  const rows = await asUser(state.userId, async (db) => {
    const { rows } = await db.query(
      `select ch.id, ch.document_id, ch.seq, ch.content,
              d.title as document_title, o.name as org_name,
              1 - (ch.embedding <=> $1::vector) as similarity
       from chunks ch
       join documents d on d.id = ch.document_id
       join orgs o on o.id = ch.org_id
       order by ch.embedding <=> $1::vector
       limit 8`,
      [queryVec]
    );
    return rows;
  });
  return { chunks: rows };
}

// ── Node: answer ────────────────────────────────────────────────────────────
export async function answer(state) {
  const chunks = state.chunks ?? [];

  if (!state.question) {
    return { answer: 'Ask me something about the portfolio.', citations: [], grounded: false, mode: 'none' };
  }

  if (chunks.length === 0) {
    return {
      answer:
        "I don't have anything in the knowledge base that answers that. " +
        'If the document was just uploaded, check that it has finished processing.',
      citations: [],
      grounded: false,
      mode: process.env.ANTHROPIC_API_KEY ? 'claude' : 'local',
    };
  }

  const citations = chunks.slice(0, 4).map((ch) => ({
    documentId: ch.document_id,
    documentTitle: ch.document_title,
    org: ch.org_name,
    chunkSeq: ch.seq,
    excerpt: ch.content.length > 320 ? `${ch.content.slice(0, 320)}…` : ch.content,
    similarity: Number(ch.similarity?.toFixed?.(3) ?? ch.similarity),
  }));

  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic();
    const context = chunks
      .map((ch, i) => `[${i + 1}] (${ch.document_title}, chunk ${ch.seq})\n${ch.content}`)
      .join('\n\n---\n\n');
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      max_tokens: 700,
      system:
        'You answer questions for a private-equity talent team, strictly from the provided context. ' +
        'Cite passages inline as [1], [2] matching the numbered context blocks. ' +
        'If the context does not contain the answer, say so plainly — never invent facts.',
      messages: [{ role: 'user', content: `Context:\n\n${context}\n\nQuestion: ${state.question}` }],
    });
    return {
      answer: msg.content.map((b) => ('text' in b ? b.text : '')).join(''),
      citations,
      grounded: true,
      mode: 'claude',
    };
  }

  // Local fallback: deterministic, no external calls. Surface the passages
  // that best overlap the question and quote the strongest one.
  const top = chunks[0];
  return {
    answer:
      `Here's what the knowledge base has on that (local mode — no LLM key configured):\n\n` +
      `From "${top.document_title}" (chunk ${top.seq}):\n\n${top.content}\n\n` +
      `See the citations for ${citations.length > 1 ? 'other relevant passages' : 'the source'}.`,
    citations,
    grounded: true,
    mode: 'local',
  };
}
