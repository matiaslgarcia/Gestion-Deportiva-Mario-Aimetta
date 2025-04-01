import React, { useEffect, useState } from 'react';
import { ChevronRight, Filter, Edit, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Group } from '../../types';
import { PaymentStatusBadge } from '../layout/PaymentStatusBadge';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { Loader } from '../layout/Loader';

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  onClientClick: (clientId: string) => void;
}

export function GroupDetail({ groupId, onBack, onClientClick }: GroupDetailProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros para alumnos del grupo
  const [dniFilter, setDniFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  // Estado para mostrar/ocultar filtros en mobile
  const [showFilters, setShowFilters] = useState(false);

  // Paginado
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          locations:location_id (id, name)
        `)
        .eq('id', groupId)
        .single();
      if (error) console.error(error);
      else setGroup(data);
    };

    const fetchClients = async () => {
      try {
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
            client_groups (
              group_id,
              groups ( id, name )
            )
          `);
        if (error) throw error;
        const groupClients = (data || []).filter((client: any) =>
          client.client_groups && client.client_groups.some((cg: any) => cg.group_id === groupId)
        );
        setClients(groupClients);
      } catch (error) {
        console.error('Error fetching clients for group:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
    fetchClients();
  }, [groupId]);

  const calculateAge = (birth_date: string) => {
    const birth = new Date(birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getMappedPaymentStatus = (client: any) => {
    const statusColor = getPaymentStatusColor(client.payment_date, client.last_payment) || 'red';
    return statusColor === 'green'
      ? 'pagado'
      : statusColor === 'yellow'
      ? 'pendiente'
      : statusColor === 'red'
      ? 'no pagado'
      : 'Desconocido';
  };

  const normalizeDNI = (dni: string) => dni.replace(/\D/g, '');
  const filteredClients = clients.filter(client => {
    if (dniFilter && !normalizeDNI(client.dni).includes(normalizeDNI(dniFilter))) {
      return false;
    }
    const fullName = `${client.name} ${client.surname}`.toLowerCase();
    if (nameFilter && !fullName.includes(nameFilter.toLowerCase().trim())) {
      return false;
    }
    const status = getMappedPaymentStatus(client);
    if (paymentFilter !== 'all' && status !== paymentFilter) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [dniFilter, nameFilter, paymentFilter]);

  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) return <Loader message="Cargando Información del Grupo..." />;
  if (!group)
    return <div className="p-4 text-center text-sm">Grupo no encontrado</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 md:p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mr-4">
          <ChevronRight className="h-6 w-6 transform rotate-180" />
        </button>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{group.name}</h2>
      </div>
      <div className="mb-4 space-y-1">
        <p className="text-gray-700 text-sm sm:text-base">
          <span className="font-semibold">Horario:</span> {group.horario}
        </p>
        <p className="text-gray-700 text-sm sm:text-base">
          <span className="font-semibold">Día(s):</span> {group.day_of_week}
        </p>
        <p className="text-gray-700 text-sm sm:text-base">
          <span className="font-semibold">Sede:</span> {group.locations ? group.locations.name : '-'}
        </p>
      </div>
      {/* Botón de filtros en mobile */}
      <div className="mb-4 md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 bg-indigo-600 text-white rounded-full"
          aria-label="Mostrar filtros"
        >
          <Filter className="h-6 w-6" />
        </button>
      </div>
      {/* Filtros */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4 p-4 bg-gray-50 rounded`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filtrar por DNI"
            value={dniFilter}
            onChange={(e) => setDniFilter(e.target.value)}
            className="border rounded-md py-2 px-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Filtrar por Nombre o Apellido"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded-md py-2 px-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border rounded-md py-2 px-3 text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados de pago</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="no pagado">No Pagado</option>
          </select>
        </div>
      </div>
      <h3 className="text-lg sm:text-xl font-semibold mb-4">Alumnos en este Grupo</h3>
      {/* Vista de tabla para tablet/desktop */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Nombre</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">DNI</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Teléfono</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Dirección</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Edad</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-semibold text-gray-700">Estado de Pago</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedClients.map(client => (
                <tr
                  key={client.id}
                  onClick={() => onClientClick(client.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                    {client.name} {client.surname}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">{client.dni}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">{client.phone}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">{client.direction}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">{calculateAge(client.birth_date)}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-800">
                    <PaymentStatusBadge
                      statusColor={getPaymentStatusColor(client.payment_date, client.last_payment) || 'red'}
                    />
                  </td>
                </tr>
              ))}
              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-500">
                    No se encontraron alumnos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Vista en tarjetas para mobile */}
      <div className="block md:hidden">
        {paginatedClients.map(client => (
          <div
            key={client.id}
            onClick={() => onClientClick(client.id)}
            className="bg-white shadow rounded p-4 mb-4 cursor-pointer"
          >
            <h2 className="font-bold text-gray-900">{client.name} {client.surname}</h2>
            <p className="text-gray-700"><strong>DNI:</strong> {client.dni}</p>
            <p className="text-gray-700"><strong>Teléfono:</strong> {client.phone}</p>
            <p className="text-gray-700"><strong>Edad:</strong> {calculateAge(client.birth_date)}</p>
            <p className="text-gray-700">
              <strong>Estado de Pago:</strong>{' '}
              <PaymentStatusBadge statusColor={getPaymentStatusColor(client.payment_date, client.last_payment)} />
            </p>
          </div>
        ))}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
      {/* Paginado para la vista en tabla */}
      <div className="hidden md:block">
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
