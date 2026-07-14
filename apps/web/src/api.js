// Thin API client. The active user id rides along as x-user-id — the server
// and database decide what that user can see.

export function activeUserId() {
  return localStorage.getItem('sb.userId');
}

export function setActiveUserId(id) {
  if (id) localStorage.setItem('sb.userId', String(id));
  else localStorage.removeItem('sb.userId');
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  const userId = activeUserId();
  if (userId) headers['x-user-id'] = userId;
  if (options.json !== undefined) {
    headers['content-type'] = 'application/json';
    options = { ...options, body: JSON.stringify(options.json) };
  }
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}
