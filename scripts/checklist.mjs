// Automated pass over ACCEPTANCE.md items 1, 2, 4 and 5 (and an assisted probe
// of item 3). Runs inside the api container: `make checklist`.
// Items 3 and 6 need human judgment — this script says so rather than faking them.

const API = 'http://localhost:4000';

const results = [];
const record = (item, pass, note) => {
  results.push({ item, pass, note });
  console.log(`${pass === true ? '✅' : pass === false ? '❌' : '👀'} ${item} — ${note}`);
};

async function api(path, { userId, ...options } = {}) {
  const headers = { ...(options.headers ?? {}) };
  if (userId) headers['x-user-id'] = String(userId);
  if (options.json !== undefined) {
    headers['content-type'] = 'application/json';
    options.body = JSON.stringify(options.json);
    delete options.json;
  }
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  const users = await api('/api/users');
  const alex = users.find((u) => u.name.includes('Alex Rivera'));
  const priya = users.find((u) => u.name.includes('Priya Sharma'));
  if (!alex || !priya) throw new Error('expected users Alex Rivera and Priya Sharma in /api/users');

  // ── Item 1: portfolio dashboard ──────────────────────────────────────────
  try {
    const orgs = await api('/api/orgs', { userId: alex.id });
    const portcos = orgs.filter((o) => o.kind === 'portco');
    record(
      'Item 1 · login + portfolio',
      portcos.length === 3,
      portcos.length === 3
        ? `Alex sees all 3 portcos (${portcos.map((o) => o.slug).join(', ')})`
        : `Alex sees ${portcos.length}/3 portcos`
    );
  } catch (err) {
    record('Item 1 · login + portfolio', false, err.message);
  }

  // ── Item 2: upload → Processed ───────────────────────────────────────────
  const token = `probe-${Date.now().toString(36)}`;
  let uploadedDocId = null;
  try {
    const orgs = await api('/api/orgs', { userId: alex.id });
    const pc2 = orgs.find((o) => o.slug === 'pc2');
    if (!pc2) throw new Error('PC2 not visible to Alex');

    const content = [
      '# Acceptance probe — Cascade Care Group',
      '',
      `This synthetic verification document was uploaded by the acceptance checklist.`,
      `The Cascade verification phrase is "${token}". Remember it exactly.`,
    ].join('\n');
    const form = new FormData();
    form.append('file', new File([content], `acceptance-probe-${token}.md`, { type: 'text/markdown' }));
    form.append('orgId', String(pc2.id));
    const doc = await api('/api/documents', { method: 'POST', body: form, userId: alex.id });
    uploadedDocId = doc.id;

    const deadline = Date.now() + 150_000;
    let status = doc.status;
    while (Date.now() < deadline && status !== 'processed' && status !== 'failed') {
      await sleep(5000);
      const docs = await api(`/api/documents?orgId=${pc2.id}`, { userId: alex.id });
      status = docs.find((d) => d.id === uploadedDocId)?.status ?? status;
    }
    record(
      'Item 2 · upload → Processed',
      status === 'processed',
      status === 'processed' ? 'processed within the window' : `ended as "${status}" after 150s`
    );
  } catch (err) {
    record('Item 2 · upload → Processed', false, err.message);
  }

  // ── Item 3: grounded answer (assisted probe — verify the UI yourself) ────
  try {
    const res = await api('/api/ask', {
      method: 'POST',
      json: { question: `What is the Cascade verification phrase?` },
      userId: alex.id,
    });
    const answered = (res.answer ?? '').includes(token);
    const cited = (res.citations ?? []).some((c) => (c.excerpt ?? '').includes(token));
    record(
      'Item 3 · grounded answer (assisted)',
      answered && cited ? 'manual' : false,
      answered && cited
        ? 'probe answer + citation carry the phrase — now verify in the UI that the citation traces to the real line'
        : `probe failed (answer ${answered ? 'has' : 'MISSING'} phrase, citation ${cited ? 'has' : 'MISSING'} phrase)`
    );
  } catch (err) {
    record('Item 3 · grounded answer (assisted)', false, err.message);
  }

  // ── Item 4: isolation ────────────────────────────────────────────────────
  try {
    const docs = await api('/api/documents', { userId: priya.id });
    const leakedDocs = docs.filter((d) => d.org_slug !== 'pc1');
    const res = await api('/api/ask', {
      method: 'POST',
      json: { question: `What is the Cascade verification phrase?` },
      userId: priya.id,
    });
    const leakedAnswer =
      (res.answer ?? '').includes(token) || (res.citations ?? []).some((c) => (c.excerpt ?? '').includes(token));
    const pass = leakedDocs.length === 0 && !leakedAnswer;
    record(
      'Item 4 · isolation',
      pass,
      pass
        ? 'Priya (PC1) sees no PC2 documents and cannot retrieve PC2 content'
        : `LEAK: ${leakedDocs.length} non-PC1 docs visible${leakedAnswer ? ' + PC2 content reachable via the brain' : ''}`
    );
  } catch (err) {
    record('Item 4 · isolation', false, err.message);
  }

  // ── Item 5: talent review renders complete ───────────────────────────────
  try {
    const execs = await api('/api/talent-review', { userId: alex.id });
    const incomplete = execs.filter((e) => (e.scores ?? []).length !== 3);
    const orgsCovered = new Set(execs.map((e) => e.org_slug));
    const pass = execs.length > 0 && incomplete.length === 0 && ['pc1', 'pc2', 'pc3'].every((s) => orgsCovered.has(s));
    record(
      'Item 5 · talent review',
      pass,
      pass
        ? `${execs.length} executives across 3 portcos, all fully scored`
        : `${incomplete.length} execs missing dimensions; portcos covered: ${[...orgsCovered].join(',') || 'none'}`
    );
  } catch (err) {
    record('Item 5 · talent review', false, err.message);
  }

  record('Item 6 · scores reconcile', 'manual', 'human judgment — follow the spot-check steps in ACCEPTANCE.md');
} catch (err) {
  console.error(`checklist aborted: ${err.message}`);
  process.exit(2);
}

const failed = results.filter((r) => r.pass === false).length;
const manual = results.filter((r) => r.pass === 'manual').length;
console.log(`\n${results.length - failed - manual} passed · ${failed} failed · ${manual} need your eyes`);
process.exit(failed ? 1 : 0);
