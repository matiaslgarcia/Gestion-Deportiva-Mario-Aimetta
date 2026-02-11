import React, { useCallback, useEffect, useState } from 'react';
import { Location, Group } from '../../types';
import { PaymentStatusBadge } from '../layout/PaymentStatusBadge';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { calculateAge } from '../../utils/date';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Edit, Trash, Filter, Plus } from 'lucide-react';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { api, ClientWithRelations } from '../../lib/api';

type ExtendedClient = ClientWithRelations;

interface ClientListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isActive?: boolean; // true: mostrar activos; false: mostrar inactivos
  onEnable?: (id: string) => void; // función para habilitar alumno inactivo
}

export function ClientList({ onView, onEdit, onDelete, onAdd, isActive = true, onEnable }: ClientListProps) {
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtros
  const [dniFilter, setDniFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('');
  // Estado para filtros en mobile
  const [showFilters, setShowFilters] = useState(false);

  // Paginado
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.clients.list(isActive);
      setClients(data || []);
    } catch {
        // Error silencioso al cargar clientes
      } finally {
      setLoading(false);
    }
  }, [isActive]);

  const fetchLocations = useCallback(async () => {
    try {
      const data = await api.locations.list();
      setLocations(data || []);
    } catch {
        // Error silencioso al cargar ubicaciones
      }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const data = await api.groups.list();
      setGroups(
        (data || []).map((g) => ({
          id: g.id,
          name: g.name,
          horario: g.horario,
          day_of_week: g.day_of_week,
          location_id: g.location_id,
          min_age: g.min_age,
          max_age: g.max_age,
          locations: g.location
        }))
      );
    } catch {
        // Error silencioso al cargar grupos
      }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchLocations();
    fetchGroups();
  }, [fetchClients, fetchLocations, fetchGroups]);

  const formatAge = (birthDate?: string | null) => {
    const age = calculateAge(birthDate);
    return age === null ? '-' : `${age} años`;
  };

  const mapPaymentStatus = (status: string) => {
    if (status === 'green') {
      return 'pagado';
    }
    if (status === 'yellow') {
      return 'pendiente';
    }
    if (status === 'red') {
      return 'no pagado';
    }
    return 'no pagado';
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
    if (locationFilter) {
      if (!client.locations?.some((l) => l.id === locationFilter)) return false;
    }
    if (groupFilter) {
      if (!client.groups?.some((g) => g.id === groupFilter)) return false;
    }
    const realTimeStatus = getPaymentStatusColor(client.payment_date, client.last_payment);
    const status = mapPaymentStatus(realTimeStatus);
    if (paymentFilter !== 'all' && status !== paymentFilter) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [dniFilter, nameFilter, locationFilter, paymentFilter, groupFilter]);

  const totalPages = Math.ceil(filteredClients.length / rowsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setDeleteId(null);
  };

  if (loading) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <div className="p-4 animate-fade-in">
      {/* Mobile header: icon buttons for filters and add */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 bg-indigo-600 text-white rounded-full"
          aria-label="Toggle Filters"
        >
          <Filter className="h-6 w-6" />
        </button>
        <button
          onClick={onAdd}
          className="p-2 bg-green-600 text-white rounded-full"
          aria-label="Add Client"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* Filtros */}
      <div className={`mb-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <input
            type="text"
            placeholder="Buscar por DNI..."
            value={dniFilter}
            onChange={(e) => setDniFilter(e.target.value)}
            className="border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Todas las sedes</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Todos los grupos</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="all">Todos los estados de pago</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="no pagado">No Pagado</option>
          </select>
        </div>
      </div>

      {/* Vista de tabla para desktop */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-white">👤 Nombre</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">🆔 DNI</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">📞 Teléfono</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">📍 Dirección</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">🎂 Edad</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">🏢 Sede(s)</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">👥 Grupo(s)</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">💳 Estado de Pago</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">⚙️ Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedClients.map((client, index) => (
                  <tr key={client.id} onClick={() => client.id && onView(client.id)} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {client.name} {client.surname}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">{client.dni}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">{client.phone}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {client.direction || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatAge(client.birth_date)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {client.locations && client.locations.length > 0
                        ? client.locations.map(loc => loc.name).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {client.groups && client.groups.length > 0
                        ? client.groups.map(g => g.name).join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                      <PaymentStatusBadge statusColor={getPaymentStatusColor(client.payment_date, client.last_payment)} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                    {isActive ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(client.id);
                          }}
                          className="mr-3 p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 hover:shadow-md"
                          title="Editar alumno"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(client.id);
                          }}
                          className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md"
                          title="Eliminar alumno"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        {onEnable && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEnable(client.id);
                            }}
                            className="px-3 py-1.5 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 hover:shadow-md text-sm font-medium"
                            title="Habilitar alumno"
                          >
                            ✓ Habilitar
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
                {paginatedClients.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl mb-2">👥</div>
                        <p className="text-gray-500 text-sm font-medium">No se encontraron alumnos</p>
                        <p className="text-gray-400 text-xs mt-1">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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

      {/* Vista de cards para móvil y tablet */}
      <div className="lg:hidden space-y-4">
        {paginatedClients.map(client => (
          <div key={client.id} onClick={() => client.id && onView(client.id)} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {client.name.charAt(0)}{client.surname.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{client.name} {client.surname}</h3>
                  <p className="text-gray-500 text-sm">👤 Alumno</p>
                </div>
              </div>
              <PaymentStatusBadge statusColor={getPaymentStatusColor(client.payment_date, client.last_payment)} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">🆔 DNI</p>
                <p className="text-gray-900 font-semibold">{client.dni}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">📞 Teléfono</p>
                <p className="text-gray-900 font-semibold">{client.phone}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">🎂 Edad</p>
                <p className="text-gray-900 font-semibold">{formatAge(client.birth_date)}</p>
              </div>
              {client.direction && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium mb-1">📍 Dirección</p>
                  <p className="text-gray-900 font-semibold">{client.direction}</p>
                </div>
              )}
            </div>
            
            {(client.locations?.length > 0 || client.groups?.length > 0) && (
              <div className="space-y-2 mb-4">
                {client.locations && client.locations.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500 font-medium mr-2">🏢 Sedes:</span>
                    {client.locations.map((loc, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {loc.name}
                      </span>
                    ))}
                  </div>
                )}
                {client.groups && client.groups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500 font-medium mr-2">👥 Grupos:</span>
                    {client.groups.map((g, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              {isActive ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(client.id);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(client.id);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
                  >
                    <Trash className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEnable?.(client.id);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-green-600 hover:text-white hover:bg-green-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
                >
                  <span>✓ Habilitar</span>
                </button>
              )}
            </div>
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

      {showConfirm && (
        <ConfirmDialog
          message="¿Está seguro de que desea inhabilitar este alumno?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
