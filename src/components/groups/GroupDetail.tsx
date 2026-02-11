import React, { useEffect, useState } from 'react';
import { ChevronRight, Filter } from 'lucide-react';
import { Group } from '../../types';
import { PaymentStatusBadge } from '../layout/PaymentStatusBadge';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { calculateAge } from '../../utils/date';
import { Loader } from '../layout/Loader';
import { api, ClientWithRelations } from '../../lib/api';

interface GroupDetailProps {
  groupId: string;
  onBack: () => void;
  onClientClick: (clientId: string) => void;
}

export function GroupDetail({ groupId, onBack, onClientClick }: GroupDetailProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [dniFilter, setDniFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const data = await api.groups.get(groupId, true);
        setGroup({
          id: data.group.id,
          name: data.group.name,
          horario: data.group.horario,
          day_of_week: data.group.day_of_week,
          location_id: data.group.location_id,
          min_age: data.group.min_age,
          max_age: data.group.max_age,
          locations: data.group.location
        });
        setClients(data.clients || []);
      } catch {
        // Error silencioso al cargar grupo
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [groupId]);

  const getMappedPaymentStatus = (client: ClientWithRelations) => {
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
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      <div className="card-modern glass overflow-hidden border border-gray-200 hover-lift">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={onBack} 
                className="text-white/80 hover:text-white mr-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200 hover-lift animate-glow"
              >
                <ChevronRight className="h-6 w-6 transform rotate-180" />
              </button>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {group.name}
                </h2>
                <p className="text-blue-100 mt-1">Información del Grupo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 sm:p-8">
          {/* Información del grupo */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
              Información del Grupo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Sede</dt>
                <dd className="text-lg font-semibold text-gray-900">{group.locations?.name || 'No asignada'}</dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Horario</dt>
                <dd className="text-lg font-semibold text-gray-900">{group.horario || 'No especificado'}</dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Día(s)</dt>
                <dd className="text-lg font-semibold text-gray-900">{group.day_of_week || 'No especificado'}</dd>
              </div>
            </div>
          </div>

          {/* Lista de alumnos */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-3"></div>
                Alumnos del Grupo ({filteredClients.length})
              </h3>
              {/* Botón de filtros para mobile */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-3 btn-gradient text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift animate-glow"
                  aria-label="Mostrar filtros"
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-6`}>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Filtros de Búsqueda</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">DNI</label>
                    <input
                      type="text"
                      placeholder="Filtrar por DNI"
                      value={dniFilter}
                      onChange={(e) => setDniFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Nombre o Apellido</label>
                    <input
                      type="text"
                      placeholder="Filtrar por Nombre o Apellido"
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Estado de Pago</label>
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl py-3 px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm"
                    >
                      <option value="all">Todos los estados de pago</option>
                      <option value="pagado">Pagado</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="no pagado">No Pagado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista de tabla para desktop */}
            <div className="hidden md:block">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DNI</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Teléfono</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Dirección</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Edad</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado de Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedClients.map((client, index) => (
                        <tr
                          key={client.id}
                          onClick={() => onClientClick(client.id)}
                          className={`hover:bg-blue-50 transition-all duration-200 cursor-pointer ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {client.name} {client.surname}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{client.dni}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{client.phone}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{client.direction}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{calculateAge(client.birth_date) ?? '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">
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
                  <p className="text-gray-700"><strong>Edad:</strong> {calculateAge(client.birth_date) ?? '-'}</p>
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

            {/* Paginado para desktop */}
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
        </div>
      </div>
    </div>
  );
}
