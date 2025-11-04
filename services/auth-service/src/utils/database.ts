/**
 * Database connection pool
 */

import { Pool } from 'pg';
import config from './config';
import logger from './logger';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      max: config.database.max,
      idleTimeoutMillis: config.database.idleTimeoutMillis,
      connectionTimeoutMillis: config.database.connectionTimeoutMillis,
    });

    pool.on('error', (err: Error) => {
      logger.error('Unexpected error on idle database client', { error: err.message });
    });

    pool.on('connect', () => {
      logger.info('New database client connected');
    });
  }

  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = getPool();
  const start = Date.now();
  try {
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error });
    throw error;
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export default { getPool, query, closePool };
