import React, { useCallback, useEffect, useState } from 'react';
import { addMonths, format, isValid, parse, parseISO } from 'date-fns';
import { ChevronRight, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PaymentStatusBadge } from '../layout/PaymentStatusBadge';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { Loader } from '../layout/Loader';
import { api, ClientWithRelations } from '../../lib/api';

export type ExtendedClient = ClientWithRelations;

function toValidDate(value: string): Date | null {
  const parsed = value.includes('T') ? parseISO(value) : parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : null;
}

function formatDate(value?: string, fallback = '-') {
  if (!value) return fallback;
  const date = toValidDate(value);
  if (!date) return fallback;
  return format(date, 'dd/MM/yyyy');
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

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.clients.get(clientId);
      setClient(data);
    } catch {
      // Error silencioso al cargar cliente
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  // Actualiza solo el último pago realizado (sin modificar payment_status)
  const handleUpdatePayment = async () => {
    if (!client) return;
    try {
      const now = new Date();
      const isoTime = now.toISOString();
  
      await api.clients.patch(clientId, { last_payment: isoTime });
      toast.success('¡Pago actualizado correctamente!');
      setClient({ ...client, last_payment: isoTime });
      fetchClient();
    } catch {
      // Error capturado al actualizar pago
      toast.error('Error actualizando el pago');
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
        await api.clients.patch(clientId, { is_active: false });
        toast.success('Alumno dado de baja correctamente');
        onDelete(clientId);
      } catch {
        // Error capturado al dar de baja alumno
        toast.error('Error al dar de baja al alumno');
      }
    }
  };

  if (loading) return <Loader message="Cargando Información del Alumno..." />;;
  if (!client) return <div className="p-4 text-center text-sm">Alumno no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="card-modern glass shadow-xl rounded-2xl overflow-hidden border border-gray-200 hover-lift">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={onBack} 
                className="text-white/80 hover:text-white mr-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200"
              >
                <ChevronRight className="h-6 w-6 transform rotate-180" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {client.name} {client.surname}
                </h2>
                <p className="text-indigo-100 mt-1">Información del Alumno</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="p-3 text-white hover:text-indigo-100 hover:bg-white/10 rounded-full transition-all duration-200 shadow-lg"
                title="Editar alumno"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-3 text-white hover:text-red-200 hover:bg-red-500/20 rounded-full transition-all duration-200 shadow-lg"
                title="Dar de baja al alumno"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 sm:p-8">
          {/* Información Personal */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full mr-3"></div>
              Información Personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">DNI</dt>
                <dd className="text-lg font-semibold text-gray-900">{client.dni}</dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Teléfono del Padre</dt>
                <dd className="text-lg font-semibold text-gray-900">{client.phone}</dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Fecha de Nacimiento</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatDate(client.birth_date)}
                </dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 sm:col-span-2 lg:col-span-3">
                <dt className="text-sm font-medium text-gray-500 mb-1">Dirección</dt>
                <dd className="text-lg font-semibold text-gray-900">{client.direction}</dd>
              </div>
            </div>
          </div>

          {/* Información de Pagos */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-3"></div>
              Información de Pagos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Método de Pago</dt>
                <dd className="text-lg font-semibold text-gray-900">{client.method_of_payment}</dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Fecha de Pago</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatDate(client.payment_date)}
                </dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Próximo Pago</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {(() => {
                    const base = client.last_payment ?? client.payment_date;
                    if (!base) return '-';
                    const baseDate = toValidDate(base);
                    if (!baseDate) return '-';
                    return format(addMonths(baseDate, 1), 'dd/MM/yyyy');
                  })()}
                </dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Último Pago</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatDate(client.last_payment)}
                </dd>
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full mr-3"></div>
              Asignaciones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Sede(s)</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {client.locations && client.locations.length > 0
                    ? client.locations.map((l) => l.name).join(', ')
                    : '-'}
                </dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Grupo(s)</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {client.groups && client.groups.length > 0
                    ? client.groups.map((g) => g.name).join(', ')
                    : '-'}
                </dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Estado de Pago</dt>
                <dd className="flex items-center mt-2">
                  <PaymentStatusBadge statusColor={getPaymentStatusColor(client.payment_date, client.last_payment)} />
                </dd>
              </div>
            </div>
          </div>
          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4 items-start pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              onClick={handleUpdatePayment}
              className="px-6 py-3 btn-gradient text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold hover-lift animate-glow"
            >
              Registrar Pago
            </button>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 flex-1">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 text-sm font-bold">💡</span>
                </div>
                <div>
                  <p className="font-semibold text-blue-800 mb-1">Estado Automático</p>
                  <p className="text-sm text-blue-700">El estado de pago se actualiza automáticamente según las fechas. No es necesario marcarlo manualmente.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
