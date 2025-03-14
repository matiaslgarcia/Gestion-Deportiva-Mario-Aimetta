import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, Location } from '../../types';
import { PaymentStatusBadge } from '../layout/PaymentStatusBadge';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Edit, Trash } from 'lucide-react';

interface ExtendedClient extends Client {
  client_locations?: {
    location_id: string;
    locations: { id: string; name: string }[];
  }[];
  client_groups?: {
    group_id: string;
    groups: { id: string; name: string }[];
  }[];
}

interface ClientListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ClientList({ onView, onEdit, onDelete }: ClientListProps) {
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtros
  const [dniFilter, setDniFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, pagado, pendiente
  const [groupFilter, setGroupFilter] = useState('');
  // Estado para filtros en mobile
  const [showFilters, setShowFilters] = useState(false);

  // Paginado
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchLocations();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
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
          client_locations (
            location_id,
            locations ( id, name )
          ),
          client_groups (
            group_id,
            groups ( id, name )
          )
        `);
      if (error) throw error;
      setClients((data as ExtendedClient[]) || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

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

  const getPaymentStatus = (client: ExtendedClient) => {
    if (client.last_payment && new Date(client.last_payment) >= new Date(client.payment_date)) {
      return 'pagado';
    }
    return 'pendiente';
  };

  const filteredClients = clients.filter(client => {
    if (dniFilter && !client.dni.includes(dniFilter)) return false;
    if (
      nameFilter &&
      !(client.name.toLowerCase().includes(nameFilter.toLowerCase()) ||
        client.surname.toLowerCase().includes(nameFilter.toLowerCase()))
    )
      return false;
    if (locationFilter) {
      if (!client.client_locations || !client.client_locations.some(cl => cl.location_id === locationFilter))
        return false;
    }
    if (groupFilter) {
      if (
        !client.client_groups ||
        !client.client_groups.some(cg =>
          cg.groups?.name.toLowerCase().includes(groupFilter.toLowerCase())
        )
      )
        return false;
    }
    const status = getPaymentStatus(client);
    if (paymentFilter !== 'all' && status.toLowerCase() !== paymentFilter) return false;
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
    return <div className="p-4 text-center">Loading clients...</div>;
  }

  return (
    <div className="p-4">
      {/* Botón para filtros en mobile */}
      <div className="mb-4 md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>
      {/* Filtros */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4 p-4 bg-gray-50 rounded shadow-sm`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Filtrar por DNI"
            value={dniFilter}
            onChange={(e) => setDniFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Filtrar por Nombre o Apellido"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            placeholder="Filtrar por Grupo"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las Sedes</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los estados de pago</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300 text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Nombre</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">DNI</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Teléfono</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Edad</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Sede(s)</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Grupo(s)</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Estado de Pago</th>
              <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-300">
            {paginatedClients.map(client => (
              <tr key={client.id} onClick={() => client.id && onView(client.id)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                  {client.name} {client.surname}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">{client.dni}</td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">{client.phone}</td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">{calculateAge(client.birth_date)}</td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                  {client.client_locations && client.client_locations.length > 0
                    ? client.client_locations.map(cl => cl.locations?.name).join(', ')
                    : '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                  {client.client_groups && client.client_groups.length > 0
                    ? client.client_groups.map(cg => cg.groups?.name).join(', ')
                    : '-'}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                  <PaymentStatusBadge statusColor={getPaymentStatusColor(client.payment_date, client.last_payment)} />
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(client.id);
                    }}
                    className="mr-2 text-indigo-600 hover:text-indigo-900 transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(client.id);
                    }}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedClients.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">
                  No se encontraron alumnos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Controles de paginado */}
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
      {showConfirm && (
        <ConfirmDialog
          message="¿Estás seguro que quieres eliminar este alumno?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
