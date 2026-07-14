import pg from 'pg';

// The API connects as app_user — a role subject to row-level security.
// Every query runs with app.user_id set, so the database enforces org
// isolation no matter what the application code does.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

// System-level pool (table owner): used ONLY for org-agnostic system views
// like the status readout. Never handles user requests.
export const adminPool = new pg.Pool({
  connectionString: process.env.DATABASE_URL_ADMIN,
  max: 2,
});

export async function asUser(userId, fn) {
  const client = await pool.connect();
  try {
    await client.query(`select set_config('app.user_id', $1, false)`, [String(userId ?? '')]);
    return await fn(client);
  } finally {
    // Reset before the connection returns to the pool.
    await client.query(`select set_config('app.user_id', '', false)`).catch(() => {});
    client.release();
  }
}
