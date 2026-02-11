import { Pool } from 'pg';
// @ts-ignore

const dbPoolHolder = globalThis as unknown as { __dbPool?: Pool };

export function getDbPool(): Pool {
  if (dbPoolHolder.__dbPool) return dbPoolHolder.__dbPool;

  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    throw new Error('NEON_DATABASE_URL no está configurada');
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  dbPoolHolder.__dbPool = pool;
  return pool;
}
