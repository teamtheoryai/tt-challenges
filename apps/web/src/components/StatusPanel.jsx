import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';

// System Status: symptoms, never causes. Live view of service health, queue
// depths, and pipeline progress — the first place to look when the box
// misbehaves.

function Light({ ok }) {
  return <span className={`light ${ok ? 'ok' : 'bad'}`}>{ok ? '●' : '●'}</span>;
}

export default function StatusPanel() {
  const { data: status } = useQuery({
    queryKey: ['status'],
    queryFn: () => api('/api/status'),
    refetchInterval: 5000,
  });

  if (!status) return null;
  const docs = status.db?.documents ?? {};

  return (
    <div className="status-panel">
      <h3>System Status</h3>
      <div className="status-grid">
        <div>
          <Light ok={status.db?.ok} /> database
          {!status.db?.ok && <span className="error small"> {status.db?.error}</span>}
        </div>
        <div>
          <Light ok={status.storage?.ok} /> object storage
          {!status.storage?.ok && <span className="error small"> {status.storage?.error}</span>}
        </div>
        <div>
          <Light ok={status.agent?.ok} /> agent{status.agent?.mode ? ` (${status.agent.mode})` : ''}
          {!status.agent?.ok && <span className="error small"> {status.agent?.error}</span>}
        </div>
      </div>
      <table className="status-table">
        <thead>
          <tr>
            <th>queue</th>
            <th>depth</th>
            <th>in flight</th>
          </tr>
        </thead>
        <tbody>
          {(status.queues ?? []).map((q, i) => (
            <tr key={i} className={q.name?.endsWith('dlq') && q.depth > 0 ? 'warn' : ''}>
              <td>{q.name ?? '—'}</td>
              <td>{q.ok ? q.depth : <span className="error small">{q.error}</span>}</td>
              <td>{q.ok ? q.inFlight : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">
        documents: {docs.processed ?? '?'} processed · {docs.processing ?? '?'} processing · {docs.queued ?? '?'}{' '}
        queued · {docs.failed ?? '?'} failed
        {docs.last_processed_at ? ` · last processed ${new Date(docs.last_processed_at).toLocaleTimeString()}` : ''}
      </p>
    </div>
  );
}
