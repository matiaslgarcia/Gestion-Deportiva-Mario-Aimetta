import { Handler } from '@netlify/functions';
import { getDbPool } from './_db';
import { badRequest, json, methodNotAllowed } from './_http';

interface TransferPayload {
  sourceLocationId: string;
  targetLocationId: string;
  clientIds: string[] | 'all';
  targetCapacityTotal?: number | null;
}

function parseJsonBody<T>(rawBody: string | undefined): T | null {
  if (!rawBody) return null;
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    return null;
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return methodNotAllowed();
  }

  const body = parseJsonBody<TransferPayload>(event.body ?? undefined);
  if (!body || !body.sourceLocationId || !body.targetLocationId || !body.clientIds) {
    return badRequest('Faltan datos requeridos: sourceLocationId, targetLocationId, clientIds');
  }

  const { sourceLocationId, targetLocationId, clientIds } = body;

  if (sourceLocationId === targetLocationId) {
    return badRequest('La sede de origen y destino no pueden ser la misma');
  }

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sourceRes = await client.query('SELECT id, name FROM public.locations WHERE id = $1', [sourceLocationId]);
    if (sourceRes.rowCount === 0) {
      throw new Error(`Sede de origen no encontrada: ${sourceLocationId}`);
    }
    const sourceLocation = sourceRes.rows[0];

    const targetRes = await client.query('SELECT id, name FROM public.locations WHERE id = $1', [targetLocationId]);
    if (targetRes.rowCount === 0) {
      throw new Error(`Sede de destino no encontrada: ${targetLocationId}`);
    }
    const targetLocation = targetRes.rows[0];

    let idsToTransfer: string[] = [];
    if (clientIds === 'all') {
      const clientsRes = await client.query(
        'SELECT client_id FROM public.client_locations WHERE location_id = $1',
        [sourceLocationId]
      );
      idsToTransfer = clientsRes.rows.map((row: { client_id: string }) => row.client_id);
    } else {
      idsToTransfer = clientIds;
    }

    if (idsToTransfer.length > 0) {
      const validRes = await client.query(
        'SELECT client_id FROM public.client_locations WHERE location_id = $1 AND client_id = ANY($2)',
        [sourceLocationId, idsToTransfer]
      );
      const validIds = new Set(validRes.rows.map((row: { client_id: string }) => row.client_id));
      const invalidIds = idsToTransfer.filter(id => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new Error('Algunos alumnos no pertenecen a la sede de origen');
      }
    }

    const targetCountRes = await client.query(
      'SELECT COUNT(*)::int AS count FROM public.client_locations WHERE location_id = $1',
      [targetLocationId]
    );
    const currentTargetCount = targetCountRes.rows[0]?.count ?? 0;

    const alreadyInTargetRes = idsToTransfer.length
      ? await client.query(
          'SELECT client_id FROM public.client_locations WHERE location_id = $1 AND client_id = ANY($2)',
          [targetLocationId, idsToTransfer]
        )
      : { rows: [] as Array<{ client_id: string }> };
    const alreadyInTargetIds = new Set(alreadyInTargetRes.rows.map((row: { client_id: string }) => row.client_id));
    const moveIds = idsToTransfer.filter(id => !alreadyInTargetIds.has(id));

    const targetCapacityTotal =
      body.targetCapacityTotal === null || body.targetCapacityTotal === undefined
        ? null
        : Number(body.targetCapacityTotal);
    if (targetCapacityTotal !== null && Number.isNaN(targetCapacityTotal)) {
      return badRequest('Capacidad total inválida');
    }
    if (targetCapacityTotal !== null && targetCapacityTotal < 0) {
      return badRequest('La capacidad total no puede ser negativa');
    }
    if (idsToTransfer.length > 0 && targetCapacityTotal === null) {
      return badRequest('Debe indicar la capacidad total de la sede destino');
    }
    const projectedCount = currentTargetCount + moveIds.length;
    if (targetCapacityTotal !== null && projectedCount > targetCapacityTotal) {
      return badRequest('La sede destino no tiene capacidad suficiente');
    }

    if (moveIds.length > 0) {
      await client.query(
        'UPDATE public.client_locations SET location_id = $1 WHERE location_id = $2 AND client_id = ANY($3)',
        [targetLocationId, sourceLocationId, moveIds]
      );
    }
    if (alreadyInTargetIds.size > 0) {
      await client.query(
        'DELETE FROM public.client_locations WHERE location_id = $1 AND client_id = ANY($2)',
        [sourceLocationId, Array.from(alreadyInTargetIds)]
      );
    }

    await client.query('DELETE FROM public.locations WHERE id = $1', [sourceLocationId]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        action text NOT NULL,
        entity_type text NOT NULL,
        entity_id uuid,
        details jsonb,
        created_at timestamptz DEFAULT now(),
        PRIMARY KEY (id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.transfer_reports (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        source_location_id uuid NOT NULL,
        target_location_id uuid NOT NULL,
        total_selected int NOT NULL,
        total_moved int NOT NULL,
        total_already_in_target int NOT NULL,
        details jsonb,
        created_at timestamptz DEFAULT now(),
        PRIMARY KEY (id)
      );
    `);

    const clientDetailsRes = idsToTransfer.length
      ? await client.query(
          'SELECT id, name, surname, dni FROM public.clients WHERE id = ANY($1)',
          [idsToTransfer]
        )
      : { rows: [] as Array<{ id: string; name: string; surname: string; dni: string }> };

    const reportItems = clientDetailsRes.rows.map((row: { id: string; name: string; surname: string; dni: string }) => ({
      id: row.id,
      name: row.name,
      surname: row.surname,
      dni: row.dni,
      action: alreadyInTargetIds.has(row.id) ? 'already_in_target' : 'moved'
    }));

    const reportDetails = {
      sourceLocation: { id: sourceLocation.id, name: sourceLocation.name },
      targetLocation: { id: targetLocation.id, name: targetLocation.name },
      currentTargetCount,
      targetCapacityTotal,
      projectedCount,
      requestedTransferMode: clientIds === 'all' ? 'all' : 'selection',
      clients: reportItems
    };

    const reportRes = await client.query(
      `
      INSERT INTO public.transfer_reports
        (source_location_id, target_location_id, total_selected, total_moved, total_already_in_target, details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        sourceLocationId,
        targetLocationId,
        idsToTransfer.length,
        moveIds.length,
        alreadyInTargetIds.size,
        JSON.stringify(reportDetails)
      ]
    );

    const auditDetails = {
      sourceLocation: { id: sourceLocation.id, name: sourceLocation.name },
      targetLocation: { id: targetLocation.id, name: targetLocation.name },
      transferredClientsCount: idsToTransfer.length,
      requestedTransferMode: clientIds === 'all' ? 'all' : 'selection',
      reportId: reportRes.rows[0]?.id
    };

    await client.query(
      'INSERT INTO public.audit_logs (action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4)',
      ['DELETE_AND_TRANSFER', 'location', sourceLocationId, JSON.stringify(auditDetails)]
    );

    await client.query('COMMIT');

    return json(200, {
      success: true,
      message: `Sede eliminada. ${idsToTransfer.length} alumnos transferidos a ${targetLocation.name}.`,
      details: auditDetails,
      report: reportDetails
    });

  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error('Error en transferencia:', error);
    const message = error instanceof Error ? error.message : 'Error en el proceso de transferencia y eliminación';
    return json(500, { error: message });
  } finally {
    client.release();
  }
};
