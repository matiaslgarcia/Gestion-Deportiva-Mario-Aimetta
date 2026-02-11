import { Handler } from '@netlify/functions';
import { getDbPool } from './_db';
import { badRequest, json, methodNotAllowed, notFound } from './_http';

type ClientPayload = {
  name: string;
  surname: string;
  dni: string;
  phone: string;
  birth_date: string;
  payment_date: string;
  method_of_payment: 'efectivo' | 'transferencia';
  direction: string;
  location_ids?: string[];
  group_ids?: string[];
};

function parseJsonBody<T>(rawBody: string | undefined): T | null {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}

function normalizeDni(value: string) {
  return value.replace(/\D/g, '');
}

function getErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;
  if (!('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

export const handler: Handler = async (event) => {
  const pool = getDbPool();
  const id = event.queryStringParameters?.id ?? null;

  if (event.httpMethod === 'GET') {
    const activeParam = event.queryStringParameters?.active;
    const isActive =
      activeParam === undefined ? undefined : activeParam === 'true' || activeParam === '1';

    if (id) {
      const result = await pool.query(
        `
        SELECT
          c.*,
          COALESCE(
            jsonb_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name))
            FILTER (WHERE l.id IS NOT NULL),
            '[]'::jsonb
          ) AS locations,
          COALESCE(
            jsonb_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name))
            FILTER (WHERE g.id IS NOT NULL),
            '[]'::jsonb
          ) AS groups
        FROM public.clients c
        LEFT JOIN public.client_locations cl ON cl.client_id = c.id
        LEFT JOIN public.locations l ON l.id = cl.location_id
        LEFT JOIN public.client_groups cg ON cg.client_id = c.id
        LEFT JOIN public.groups g ON g.id = cg.group_id
        WHERE c.id = $1
        GROUP BY c.id
        `,
        [id]
      );

      const client = result.rows[0];
      if (!client) return notFound('Alumno no encontrado');
      const locationIdsResult = await pool.query(
        'SELECT location_id FROM public.client_locations WHERE client_id = $1',
        [id]
      );
      const groupIdsResult = await pool.query(
        'SELECT group_id FROM public.client_groups WHERE client_id = $1',
        [id]
      );
      return json(200, {
        client: {
          ...client,
          location_ids: locationIdsResult.rows.map((r: { location_id: string }) => r.location_id),
          group_ids: groupIdsResult.rows.map((r: { group_id: string }) => r.group_id)
        }
      });
    }

    if (isActive === undefined) return badRequest('Falta query param: active');

    const result = await pool.query(
      `
      SELECT
        c.*,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('id', l.id, 'name', l.name))
          FILTER (WHERE l.id IS NOT NULL),
          '[]'::jsonb
        ) AS locations,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('id', g.id, 'name', g.name))
          FILTER (WHERE g.id IS NOT NULL),
          '[]'::jsonb
        ) AS groups
      FROM public.clients c
      LEFT JOIN public.client_locations cl ON cl.client_id = c.id
      LEFT JOIN public.locations l ON l.id = cl.location_id
      LEFT JOIN public.client_groups cg ON cg.client_id = c.id
      LEFT JOIN public.groups g ON g.id = cg.group_id
      WHERE c.is_active = $1
      GROUP BY c.id
      ORDER BY c.surname ASC, c.name ASC
      `,
      [isActive]
    );
    return json(200, { clients: result.rows });
  }

  if (event.httpMethod === 'POST') {
    const body = parseJsonBody<ClientPayload>(event.body ?? undefined);
    if (!body) return badRequest('Body inválido');

    const dni = normalizeDni(body.dni);
    const locationIds = body.location_ids ?? [];
    const groupIds = body.group_ids ?? [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `
        INSERT INTO public.clients
          (name, surname, dni, phone, birth_date, payment_date, method_of_payment, direction, is_active)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,true)
        RETURNING *
        `,
        [
          body.name,
          body.surname,
          dni,
          body.phone,
          body.birth_date,
          body.payment_date,
          body.method_of_payment,
          body.direction
        ]
      );

      const newClient = inserted.rows[0];

      if (locationIds.length) {
        await client.query(
          `
          INSERT INTO public.client_locations (client_id, location_id)
          SELECT $1, UNNEST($2::uuid[])
          `,
          [newClient.id, locationIds]
        );
      }

      if (groupIds.length) {
        await client.query(
          `
          INSERT INTO public.client_groups (client_id, group_id)
          SELECT $1, UNNEST($2::uuid[])
          `,
          [newClient.id, groupIds]
        );
      }

      await client.query('COMMIT');
      return json(201, { client: { ...newClient, location_ids: locationIds, group_ids: groupIds } });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (getErrorCode(error) === '23505') {
        return json(409, { error: 'Ya existe un alumno con este DNI' });
      }
      return json(500, { error: 'Error creando alumno' });
    } finally {
      client.release();
    }
  }

  if (event.httpMethod === 'PUT') {
    if (!id) return badRequest('Falta query param: id');
    const body = parseJsonBody<ClientPayload>(event.body ?? undefined);
    if (!body) return badRequest('Body inválido');

    const dni = normalizeDni(body.dni);
    const locationIds = body.location_ids ?? [];
    const groupIds = body.group_ids ?? [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `
        UPDATE public.clients
        SET
          name = $2,
          surname = $3,
          dni = $4,
          phone = $5,
          birth_date = $6,
          payment_date = $7,
          method_of_payment = $8,
          direction = $9
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          body.name,
          body.surname,
          dni,
          body.phone,
          body.birth_date,
          body.payment_date,
          body.method_of_payment,
          body.direction
        ]
      );

      const updatedClient = updated.rows[0];
      if (!updatedClient) {
        await client.query('ROLLBACK');
        return notFound('Alumno no encontrado');
      }

      await client.query('DELETE FROM public.client_locations WHERE client_id = $1', [id]);
      if (locationIds.length) {
        await client.query(
          `
          INSERT INTO public.client_locations (client_id, location_id)
          SELECT $1, UNNEST($2::uuid[])
          `,
          [id, locationIds]
        );
      }

      await client.query('DELETE FROM public.client_groups WHERE client_id = $1', [id]);
      if (groupIds.length) {
        await client.query(
          `
          INSERT INTO public.client_groups (client_id, group_id)
          SELECT $1, UNNEST($2::uuid[])
          `,
          [id, groupIds]
        );
      }

      await client.query('COMMIT');
      return json(200, { client: { ...updatedClient, location_ids: locationIds, group_ids: groupIds } });
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (getErrorCode(error) === '23505') {
        return json(409, { error: 'Ya existe un alumno con este DNI' });
      }
      return json(500, { error: 'Error actualizando alumno' });
    } finally {
      client.release();
    }
  }

  if (event.httpMethod === 'PATCH') {
    if (!id) return badRequest('Falta query param: id');
    const body = parseJsonBody<Record<string, unknown>>(event.body ?? undefined);
    if (!body) return badRequest('Body inválido');

    if (typeof body.is_active === 'boolean') {
      const result = await pool.query(
        'UPDATE public.clients SET is_active = $2 WHERE id = $1 RETURNING id, is_active',
        [id, body.is_active]
      );
      if (!result.rows[0]) return notFound('Alumno no encontrado');
      return json(200, { client: result.rows[0] });
    }

    if (typeof body.last_payment === 'string') {
      const result = await pool.query(
        'UPDATE public.clients SET last_payment = $2 WHERE id = $1 RETURNING id, last_payment',
        [id, body.last_payment]
      );
      if (!result.rows[0]) return notFound('Alumno no encontrado');
      return json(200, { client: result.rows[0] });
    }

    return badRequest('Body inválido');
  }

  return methodNotAllowed();
};
