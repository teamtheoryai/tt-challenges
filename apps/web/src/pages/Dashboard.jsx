import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import StatusPanel from '../components/StatusPanel.jsx';

export default function Dashboard() {
  const { data: orgs, isLoading, error } = useQuery({
    queryKey: ['orgs'],
    queryFn: () => api('/api/orgs'),
  });

  return (
    <div>
      <h2>Portfolio</h2>
      {isLoading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error.message}</p>}
      <div className="cards">
        {(orgs ?? []).map((o) => (
          <div key={o.id} className={`card ${o.kind}`}>
            <div className="card-kind">{o.kind === 'fund' ? 'Fund' : o.slug.toUpperCase()}</div>
            <h3>{o.name}</h3>
            <p className="muted">
              {o.document_count} documents · {o.processed_count} processed · {o.executive_count} executives tracked
            </p>
          </div>
        ))}
      </div>
      {orgs && orgs.length === 0 && (
        <p className="error">No portfolio visible for this user — that's worth understanding.</p>
      )}
      <StatusPanel />
    </div>
  );
}
