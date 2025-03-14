export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  name: string;
  surname: string;
  dni: string;
  phone: string;
  birth_date: string;
  payment_date: string;
  last_payment?: string;
  method_of_payment: 'efectivo' | 'transferencia';
  location_ids: string[]; // IDs de las sedes asociadas (tabla client_locations)
  group_ids: string[];    // IDs de los grupos a los que pertenece (tabla client_groups)
  created_at?: string;
  updated_at?: string;
}

export interface ClientLocation {
  clientId: string;
  locationId: string;
}

export interface ClientGroup {
  clientId: string;
  groupId: string;
}

export interface Group {
  id: string;
  name: string;
  horario: string;
  day_of_week: string;
  location_id: string;
  min_age?: number;
  max_age?: number;
  locations?: {
    id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}
