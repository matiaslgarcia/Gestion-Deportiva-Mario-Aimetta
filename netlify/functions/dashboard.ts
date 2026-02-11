import { Handler } from '@netlify/functions';
import { getDbPool } from './_db';
import { json, methodNotAllowed } from './_http';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return methodNotAllowed();

  const pool = getDbPool();
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      surname,
      dni,
      phone,
      birth_date,
      payment_date,
      last_payment,
      method_of_payment,
      payment_status,
      direction,
      is_active
    FROM public.clients
    WHERE is_active = true AND payment_date IS NOT NULL
    ORDER BY surname ASC, name ASC
    `
  );

  return json(200, { clients: result.rows });
};

