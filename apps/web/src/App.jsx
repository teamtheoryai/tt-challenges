import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, activeUserId, setActiveUserId } from './api.js';
import Dashboard from './pages/Dashboard.jsx';
import Documents from './pages/Documents.jsx';
import Ask from './pages/Ask.jsx';
import TalentReview from './pages/TalentReview.jsx';

const TABS = [
  ['dashboard', 'Dashboard'],
  ['documents', 'Documents'],
  ['ask', 'Ask the Brain'],
  ['talent', 'Talent Review'],
];

function UserPicker({ onPicked }) {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => api('/api/users'),
  });

  return (
    <div className="login">
      <h1>Second Brain</h1>
      <p className="muted">DAW Capital · portfolio talent intelligence</p>
      <p>Sign in as:</p>
      {isLoading && <p className="muted">Loading users…</p>}
      {error && <p className="error">Can't reach the API: {error.message}</p>}
      <div className="user-list">
        {(users ?? []).map((u) => (
          <button
            key={u.id}
            className="user-card"
            onClick={() => {
              setActiveUserId(u.id);
              onPicked();
            }}
          >
            <strong>{u.name}</strong>
            <span className="muted">{u.role}</span>
          </button>
        ))}
      </div>
      <p className="muted small">Local sandbox — no passwords. Who you are decides what you can see.</p>
    </div>
  );
}

export default function App() {
  const [, forceRender] = useState(0);
  const [tab, setTab] = useState('dashboard');
  const userId = activeUserId();

  const { data: me } = useQuery({
    queryKey: ['me', userId],
    queryFn: () => api('/api/me'),
    enabled: !!userId,
  });

  if (!userId) return <UserPicker onPicked={() => forceRender((n) => n + 1)} />;

  return (
    <div className="shell">
      <header>
        <div>
          <strong>Second Brain</strong> <span className="muted">· DAW Capital</span>
        </div>
        <nav>
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="whoami">
          {me ? (
            <>
              <span>
                {me.name} <span className="muted">· {me.role}</span>
              </span>
              <button
                className="link"
                onClick={() => {
                  setActiveUserId(null);
                  forceRender((n) => n + 1);
                }}
              >
                switch user
              </button>
            </>
          ) : (
            '…'
          )}
        </div>
      </header>
      <main>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'documents' && <Documents />}
        {tab === 'ask' && <Ask />}
        {tab === 'talent' && <TalentReview />}
      </main>
    </div>
  );
}
