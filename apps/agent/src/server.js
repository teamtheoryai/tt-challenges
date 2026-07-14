import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { StateGraph, END } from './graph.js';
import { prepare, routeAfterPrepare, retrieve, answer } from './nodes.js';

// The answer graph:
//
//   prepare ──(question?)──▶ retrieve ──▶ answer ──▶ END
//        └───(empty)────────────────────▶ answer
//
const graph = new StateGraph()
  .addNode('prepare', prepare)
  .addNode('retrieve', retrieve)
  .addNode('answer', answer)
  .setEntryPoint('prepare')
  .addConditionalEdges('prepare', routeAfterPrepare)
  .addEdge('retrieve', 'answer')
  .addEdge('answer', END)
  .compile();

const app = new Hono();

app.get('/health', (c) =>
  c.json({ ok: true, service: 'agent', mode: process.env.ANTHROPIC_API_KEY ? 'claude' : 'local' })
);

app.post('/answer', async (c) => {
  const { question, userId } = await c.req.json();
  if (!userId) return c.json({ error: 'userId required' }, 400);
  try {
    const result = await graph.invoke({ question, userId });
    return c.json({
      answer: result.answer,
      citations: result.citations ?? [],
      grounded: result.grounded ?? false,
      mode: result.mode,
    });
  } catch (err) {
    console.error('[agent] answer failed:', err);
    return c.json({ error: err.message }, 500);
  }
});

const port = 4100;
serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => {
  console.log(`[agent] listening on :${port} (${process.env.ANTHROPIC_API_KEY ? 'claude' : 'local'} mode)`);
});
