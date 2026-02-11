import type { Client, Group, Location } from '../types';

const FUNCTIONS_BASE = import.meta.env.VITE_FUNCTIONS_BASE_URL ?? '/.netlify/functions';

type ApiError = { error: string };

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data as ApiError | null)?.error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export type ClientWithRelations = Omit<Client, 'location_ids' | 'group_ids'> & {
  is_active: boolean;
  locations: Pick<Location, 'id' | 'name'>[];
  groups: Pick<Group, 'id' | 'name'>[];
  location_ids?: string[];
  group_ids?: string[];
};

export type GroupWithMeta = Group & {
  location: Pick<Location, 'id' | 'name'>;
  client_count: number;
};

export type LocationGroupRow = Group & { client_count: number };

export const api = {
  dashboard: {
    getClients: () =>
      requestJson<{ clients: ClientWithRelations[] }>('/dashboard').then((r) => r.clients)
  },
  clients: {
    list: (isActive: boolean) =>
      requestJson<{ clients: ClientWithRelations[] }>(`/clients?active=${isActive ? 'true' : 'false'}`).then(
        (r) => r.clients
      ),
    get: (id: string) =>
      requestJson<{ client: ClientWithRelations }>(`/clients?id=${encodeURIComponent(id)}`).then(
        (r) => r.client
      ),
    create: (payload: {
      name: string;
      surname: string;
      dni: string;
      phone: string;
      birth_date: string;
      payment_date: string;
      method_of_payment: 'efectivo' | 'transferencia';
      direction: string;
      location_ids: string[];
      group_ids: string[];
    }) =>
      requestJson<{ client: ClientWithRelations }>('/clients', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then((r) => r.client),
    update: (
      id: string,
      payload: {
        name: string;
        surname: string;
        dni: string;
        phone: string;
        birth_date: string;
        payment_date: string;
        method_of_payment: 'efectivo' | 'transferencia';
        direction: string;
        location_ids: string[];
        group_ids: string[];
      }
    ) =>
      requestJson<{ client: ClientWithRelations }>(`/clients?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then((r) => r.client),
    patch: (id: string, payload: { is_active?: boolean; last_payment?: string }) =>
      requestJson<{ client: Partial<ClientWithRelations> }>(`/clients?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }).then((r) => r.client)
  },
  locations: {
    list: () =>
      requestJson<{ locations: Location[] }>('/locations').then((r) => r.locations),
    get: (id: string, includeGroups: boolean) =>
      requestJson<{ location: Location; groups?: LocationGroupRow[] }>(
        `/locations?id=${encodeURIComponent(id)}&include_groups=${includeGroups ? 'true' : 'false'}`
      ),
    create: (payload: { name: string; address: string; phone: string }) =>
      requestJson<{ location: Location }>('/locations', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then((r) => r.location),
    update: (id: string, payload: { name: string; address: string; phone: string }) =>
      requestJson<{ location: Location }>(`/locations?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then((r) => r.location),
    delete: (id: string) =>
      requestJson<{ ok: true }>(`/locations?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).then(
        () => undefined
      )
  },
  groups: {
    list: () => requestJson<{ groups: GroupWithMeta[] }>('/groups').then((r) => r.groups),
    get: (id: string, includeClients: boolean) =>
      requestJson<{ group: GroupWithMeta; clients?: ClientWithRelations[] }>(
        `/groups?id=${encodeURIComponent(id)}&include_clients=${includeClients ? 'true' : 'false'}`
      ),
    create: (payload: { name: string; horario: string; day_of_week: string; location_id: string }) =>
      requestJson<{ group: Group }>('/groups', {
        method: 'POST',
        body: JSON.stringify(payload)
      }).then((r) => r.group),
    update: (
      id: string,
      payload: { name: string; horario: string; day_of_week: string; location_id: string }
    ) =>
      requestJson<{ group: Group }>(`/groups?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }).then((r) => r.group),
    delete: (id: string) =>
      requestJson<{ ok: true }>(`/groups?id=${encodeURIComponent(id)}`, { method: 'DELETE' }).then(
        () => undefined
      )
  }
};
