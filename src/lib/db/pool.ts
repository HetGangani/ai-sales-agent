import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' || connectionString.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err);
    });
  }

  return pool;
}

export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<R> | null> {
  const p = getDbPool();
  if (!p) {
    return null;
  }
  return p.query<R>(text, params);
}

export async function testDbConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const p = getDbPool();
  if (!p) {
    return { connected: false, latencyMs: 0, error: 'DATABASE_URL is not configured' };
  }
  const start = Date.now();
  try {
    const res = await p.query('SELECT 1 as health_check');
    return {
      connected: res.rows.length > 0,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
