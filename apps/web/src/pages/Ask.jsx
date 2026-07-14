import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api.js';

export default function Ask() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);

  const ask = useMutation({
    mutationFn: (q) => api('/api/ask', { method: 'POST', json: { question: q } }),
    onSuccess: (result, q) => {
      setHistory((h) => [{ question: q, result }, ...h]);
      setQuestion('');
    },
  });

  return (
    <div>
      <h2>Ask the Brain</h2>
      <p className="muted">
        Answers come only from documents you can see, with citations back to the source passage.
      </p>
      <form
        className="ask-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask.mutate(question.trim());
        }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What did the Q2 board deck say about Ridgeline's operating ratio?"
        />
        <button type="submit" disabled={ask.isPending}>
          {ask.isPending ? 'Thinking…' : 'Ask'}
        </button>
      </form>
      {ask.error && <p className="error">{ask.error.message}</p>}

      {history.map((entry, i) => (
        <div key={i} className="answer-card">
          <p className="question">“{entry.question}”</p>
          <div className="answer">
            {entry.result.answer.split('\n').map((line, j) => (
              <p key={j}>{line}</p>
            ))}
          </div>
          <div className="citations">
            <strong>Citations</strong>
            {entry.result.citations.length === 0 && (
              <p className="muted small">None — treat this answer as ungrounded.</p>
            )}
            {entry.result.citations.map((c, j) => (
              <details key={j}>
                <summary>
                  [{j + 1}] {c.documentTitle} · chunk {c.chunkSeq} · {c.org}
                </summary>
                <blockquote>{c.excerpt}</blockquote>
              </details>
            ))}
          </div>
          <p className="muted small">mode: {entry.result.mode} · grounded: {String(entry.result.grounded)}</p>
        </div>
      ))}
    </div>
  );
}
