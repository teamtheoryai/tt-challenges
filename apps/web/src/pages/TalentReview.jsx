import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';

const DIMENSIONS = ['performance', 'risk_of_loss', 'succession_readiness'];
const DIM_LABEL = {
  performance: 'Performance',
  risk_of_loss: 'Risk of loss',
  succession_readiness: 'Succession',
};

function ExecDetail({ execId, onClose }) {
  const { data: exec, error } = useQuery({
    queryKey: ['executive', execId],
    queryFn: () => api(`/api/executives/${execId}`),
  });

  return (
    <div className="drawer">
      <button className="link" onClick={onClose}>
        ← back to review
      </button>
      {error && <p className="error">{error.message}</p>}
      {exec && (
        <>
          <h3>
            {exec.name} <span className="muted">· {exec.title} · {exec.org_name}</span>
          </h3>
          {exec.scores.map((s) => (
            <div key={s.id} className="score-block">
              <h4>
                {DIM_LABEL[s.dimension] ?? s.dimension}: <strong>{s.score}</strong>
              </h4>
              <p>{s.rationale}</p>
              <table className="source-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Reference</th>
                    <th>Note</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {s.sources.map((src, i) => (
                    <tr key={i}>
                      <td>{src.sourceType.replace(/_/g, ' ')}</td>
                      <td className="mono small">{src.documentRef}</td>
                      <td>{src.note}</td>
                      <td>{src.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {s.sources.length === 0 && <p className="error small">No sources recorded for this score.</p>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default function TalentReview() {
  const [selected, setSelected] = useState(null);
  const { data: execs, isLoading, error } = useQuery({
    queryKey: ['talent-review'],
    queryFn: () => api('/api/talent-review'),
  });

  if (selected) return <ExecDetail execId={selected} onClose={() => setSelected(null)} />;

  const byOrg = {};
  for (const e of execs ?? []) (byOrg[e.org_name] ??= []).push(e);

  return (
    <div>
      <h2>Talent Review</h2>
      <p className="muted">
        The portfolio-wide leadership read. Click an executive for the evidence behind each score.
      </p>
      {isLoading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error.message}</p>}
      {Object.entries(byOrg).map(([orgName, rows]) => (
        <div key={orgName}>
          <h3>{orgName}</h3>
          <table className="review-table">
            <thead>
              <tr>
                <th>Executive</th>
                <th>Title</th>
                {DIMENSIONS.map((d) => (
                  <th key={d}>{DIM_LABEL[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const scores = Object.fromEntries(e.scores.map((s) => [s.dimension, s.score]));
                return (
                  <tr key={e.id} onClick={() => setSelected(e.id)} className="clickable">
                    <td>{e.name}</td>
                    <td className="muted">{e.title}</td>
                    {DIMENSIONS.map((d) => (
                      <td key={d} className={scores[d] === undefined ? 'error' : ''}>
                        {scores[d] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
