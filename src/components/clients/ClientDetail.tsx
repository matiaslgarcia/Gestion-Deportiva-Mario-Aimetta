import React, { useEffect, useState } from 'react';
import { format, addMonths, parse } from 'date-fns';
import { ChevronRight, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { Client } from '../../types';
import { PaymentStatusBadge } from '../layout/PaymentStatusBadge';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { Loader } from '../layout/Loader';

export interface ExtendedClient extends Omit<Client, 'location_ids' | 'group_ids'> {
  client_locations?: {
    location_id: string;
    location: {
      id: string;
      name: string;
    }[];
  }[];
  client_groups?: {
    group_id: string;
    group: {
      id: string;
      name: string;
    }[];
  }[];
}

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
  onEdit?: (client: ExtendedClient) => void;
  onDelete?: (clientId: string) => void;
}

export function ClientDetail({ clientId, onBack, onEdit, onDelete }: ClientDetailProps) {
  const [client, setClient] = useState<ExtendedClient | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select(`
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
        client_locations (
          location_id,
          location: locations ( id, name )
        ),
        client_groups (
          group_id,
          group: groups ( id, name )
        )
      `)
      .eq('id', clientId)
      .single();
    if (error) {
      console.error(error);
    } else {
      setClient(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  // Actualiza el registro a "Pagado": se actualiza last_payment y payment_status.
  const handleUpdatePayment = async () => {
    if (!client) return;
    try {
      const now = new Date();
      const isoTime = now.toISOString();
      const newStatus = getPaymentStatusColor(client.payment_date, isoTime);
  
      const { error } = await supabase
        .from('clients')
        .update({ last_payment: isoTime, payment_status: newStatus })
        .eq('id', clientId);
      if (error) {
        console.error('Error actualizando el pago:', error);
        toast.error('Error actualizando el pago');
      } else {
        toast.success('¡Pago actualizado correctamente!');
        setClient({ ...client, last_payment: isoTime, payment_status: newStatus });
        fetchClient();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error actualizando el pago');
    }
  };

  // Actualiza el registro a "No Pagado": se establece last_payment en null y se actualiza payment_status.
  const handleMarkNotPaid = async () => {
    if (!client) return;
    try {
      const newStatus = getPaymentStatusColor(client.payment_date, '');
      const { error } = await supabase
        .from('clients')
        .update({ last_payment: null, payment_status: newStatus })
        .eq('id', clientId);
      if (error) {
        console.error('Error actualizando estado de pago:', error);
        toast.error('Error actualizando estado de pago');
      } else {
        toast.success('Estado de pago actualizado a No Pagado');
        setClient({ ...client, last_payment: '', payment_status: newStatus });
        fetchClient();
      }
    } catch (err) {
      console.error(err);
      toast.error('Error actualizando estado de pago');
    }
  };

  const handleEdit = () => {
    if (client && onEdit) {
      onEdit(client);
    }
  };

  const handleDelete = async () => {
    if (!client || !onDelete) return;
    
    if (window.confirm('¿Estás seguro de que deseas dar de baja a este alumno?')) {
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId);
        
        if (error) {
          console.error('Error al dar de baja al alumno:', error);
          toast.error('Error al dar de baja al alumno');
        } else {
          toast.success('Alumno dado de baja correctamente');
          onDelete(clientId);
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al dar de baja al alumno');
      }
    }
  };

  if (loading) return <Loader message="Cargando Información del Alumno..." />;;
  if (!client) return <div className="p-4 text-center text-sm">Alumno no encontrado</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mr-4">
            <ChevronRight className="h-6 w-6 transform rotate-180" />
          </button>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            {client.name} {client.surname}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors"
            title="Editar alumno"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
            title="Dar de baja al alumno"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <dt className="text-sm font-medium text-gray-600">DNI</dt>
          <dd className="mt-1 text-sm text-gray-800">{client.dni}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Teléfono del Padre</dt>
          <dd className="mt-1 text-sm text-gray-800">{client.phone}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Fecha de Nacimiento</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {client.birth_date
              ? format(parse(client.birth_date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Dirección</dt>
          <dd className="mt-1 text-sm text-gray-800">{client.direction}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Método de Pago</dt>
          <dd className="mt-1 text-sm text-gray-800">{client.method_of_payment}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Fecha de Pago</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {client.payment_date
              ? format(parse(client.payment_date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Fecha Próxima de Pago </dt>
          <dd className="mt-1 text-sm text-gray-800">
            {client.payment_date
              ? format(parse(client.payment_date, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy')
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Fecha del último Pago Realizado</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {client.last_payment ? format(parse(client.last_payment, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy') : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Sede(s)</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {client.client_locations && client.client_locations.length > 0
              ? client.client_locations.map(cl => cl.location?.name).join(', ')
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Grupo(s)</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {client.client_groups && client.client_groups.length > 0
              ? client.client_groups.map(cg => cg.group?.name).join(', ')
              : '-'}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Estado de Pago</dt>
          <dd className="mt-1 text-sm text-gray-800">
            <PaymentStatusBadge statusColor={getPaymentStatusColor(client.payment_date, client.last_payment)} />
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
        <button
          onClick={handleUpdatePayment}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          Actualizar Pago
        </button>
        <button
          onClick={handleMarkNotPaid}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          Marcar como No Pagado
        </button>
      </div>
    </div>
  );
}
