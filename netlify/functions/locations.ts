import { Handler } from '@netlify/functions';
import { getDbPool } from './_db';
import { badRequest, json, methodNotAllowed, notFound } from './_http';

type LocationPayload = {
  name: string;
  address: string;
  phone: string;
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
  const includeGroups =
    event.queryStringParameters?.include_groups === 'true' ||
    event.queryStringParameters?.include_groups === '1';

  if (event.httpMethod === 'GET') {
    if (id) {
      const locationResult = await pool.query('SELECT * FROM public.locations WHERE id = $1', [id]);
      const location = locationResult.rows[0];
      if (!location) return notFound('Sede no encontrada');

      if (!includeGroups) return json(200, { location });

      const groupsResult = await pool.query(
        `
        SELECT
          g.*,
          COALESCE(COUNT(cg.client_id), 0)::int AS client_count
        FROM public.groups g
        LEFT JOIN public.client_groups cg ON cg.group_id = g.id
        WHERE g.location_id = $1
        GROUP BY g.id
        ORDER BY g.name ASC
        `,
        [id]
      );

      return json(200, { location, groups: groupsResult.rows });
    }

    const result = await pool.query('SELECT * FROM public.locations ORDER BY name ASC');
    return json(200, { locations: result.rows });
  }

  if (event.httpMethod === 'POST') {
    const body = parseJsonBody<LocationPayload>(event.body);
    if (!body) return badRequest('Body inválido');

    const exists = await pool.query(
      'SELECT 1 FROM public.locations WHERE lower(name) = lower($1) LIMIT 1',
      [body.name.trim()]
    );
    if (exists.rows.length) return json(409, { error: 'Ya existe una sede con este nombre' });

    const inserted = await pool.query(
      `
      INSERT INTO public.locations (name, address, phone)
      VALUES ($1,$2,$3)
      RETURNING *
      `,
      [body.name, body.address, body.phone]
    );
    return json(201, { location: inserted.rows[0] });
  }

  if (event.httpMethod === 'PUT') {
    if (!id) return badRequest('Falta query param: id');
    const body = parseJsonBody<LocationPayload>(event.body);
    if (!body) return badRequest('Body inválido');

    const exists = await pool.query(
      'SELECT 1 FROM public.locations WHERE lower(name) = lower($1) AND id <> $2 LIMIT 1',
      [body.name.trim(), id]
    );
    if (exists.rows.length) return json(409, { error: 'Ya existe una sede con este nombre' });

    const updated = await pool.query(
      `
      UPDATE public.locations
      SET name = $2, address = $3, phone = $4
      WHERE id = $1
      RETURNING *
      `,
      [id, body.name, body.address, body.phone]
    );
    if (!updated.rows[0]) return notFound('Sede no encontrada');
    return json(200, { location: updated.rows[0] });
  }

  if (event.httpMethod === 'DELETE') {
    if (!id) return badRequest('Falta query param: id');
    const deleted = await pool.query('DELETE FROM public.locations WHERE id = $1 RETURNING id', [id]);
    if (!deleted.rows[0]) return notFound('Sede no encontrada');
    return json(200, { ok: true });
  }

  return methodNotAllowed();
};

