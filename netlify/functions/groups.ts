import { Handler } from '@netlify/functions';
import { getDbPool } from './_db';
import { badRequest, json, methodNotAllowed, notFound } from './_http';

type GroupPayload = {
  name: string;
  horario: string;
  day_of_week: string;
  location_id: string;
};

function parseJsonBody<T>(rawBody: string | undefined): T | null {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  const pool = getDbPool();
  const id = event.queryStringParameters?.id ?? null;
  const includeClients =
    event.queryStringParameters?.include_clients === 'true' ||
    event.queryStringParameters?.include_clients === '1';

  if (event.httpMethod === 'GET') {
    if (id) {
      const groupResult = await pool.query(
        `
        SELECT g.*, jsonb_build_object('id', l.id, 'name', l.name) AS location
        FROM public.groups g
        JOIN public.locations l ON l.id = g.location_id
        WHERE g.id = $1
        `,
        [id]
      );
      const group = groupResult.rows[0];
      if (!group) return notFound('Grupo no encontrado');

      if (!includeClients) return json(200, { group });

      const clientsResult = await pool.query(
        `
        SELECT
          c.id,
          c.name,
          c.surname,
          c.dni,
          c.phone,
          c.birth_date,
          c.payment_date,
          c.last_payment,
          c.method_of_payment,
          c.payment_status,
          c.direction
        FROM public.client_groups cg
        JOIN public.clients c ON c.id = cg.client_id
        WHERE cg.group_id = $1 AND c.is_active = true
        ORDER BY c.surname ASC, c.name ASC
        `,
        [id]
      );

      return json(200, { group, clients: clientsResult.rows });
    }

    const result = await pool.query(
      `
      SELECT
        g.*,
        jsonb_build_object('id', l.id, 'name', l.name) AS location,
        COALESCE(COUNT(cg.client_id), 0)::int AS client_count
      FROM public.groups g
      JOIN public.locations l ON l.id = g.location_id
      LEFT JOIN public.client_groups cg ON cg.group_id = g.id
      GROUP BY g.id, l.id
      ORDER BY g.name ASC
      `
    );

    return json(200, { groups: result.rows });
  }

  if (event.httpMethod === 'POST') {
    const body = parseJsonBody<GroupPayload>(event.body);
    if (!body) return badRequest('Body inválido');

    const exists = await pool.query(
      'SELECT 1 FROM public.groups WHERE lower(name) = lower($1) LIMIT 1',
      [body.name.trim()]
    );
    if (exists.rows.length) return json(409, { error: 'Ya existe un grupo con este nombre' });

    const inserted = await pool.query(
      `
      INSERT INTO public.groups (name, horario, day_of_week, location_id)
      VALUES ($1,$2,$3,$4)
      RETURNING *
      `,
      [body.name, body.horario, body.day_of_week, body.location_id]
    );
    return json(201, { group: inserted.rows[0] });
  }

  if (event.httpMethod === 'PUT') {
    if (!id) return badRequest('Falta query param: id');
    const body = parseJsonBody<GroupPayload>(event.body);
    if (!body) return badRequest('Body inválido');

    const exists = await pool.query(
      'SELECT 1 FROM public.groups WHERE lower(name) = lower($1) AND id <> $2 LIMIT 1',
      [body.name.trim(), id]
    );
    if (exists.rows.length) return json(409, { error: 'Ya existe un grupo con este nombre' });

    const updated = await pool.query(
      `
      UPDATE public.groups
      SET name = $2, horario = $3, day_of_week = $4, location_id = $5
      WHERE id = $1
      RETURNING *
      `,
      [id, body.name, body.horario, body.day_of_week, body.location_id]
    );
    if (!updated.rows[0]) return notFound('Grupo no encontrado');
    return json(200, { group: updated.rows[0] });
  }

  if (event.httpMethod === 'DELETE') {
    if (!id) return badRequest('Falta query param: id');
    const deleted = await pool.query('DELETE FROM public.groups WHERE id = $1 RETURNING id', [id]);
    if (!deleted.rows[0]) return notFound('Grupo no encontrado');
    return json(200, { ok: true });
  }

  return methodNotAllowed();
};

