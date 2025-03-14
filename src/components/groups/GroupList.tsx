import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Group, Location } from '../../types';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Edit, Trash, Filter, Plus } from 'lucide-react';

interface GroupListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function GroupList({ onView, onEdit, onDelete, onAdd }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clientGroups, setClientGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [nameFilter, setNameFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  // Estado para mostrar/ocultar filtros en mobile
  const [showFilters, setShowFilters] = useState(false);

  // Paginado
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchLocations();
    fetchClientGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*, locations:location_id (id, name)');
      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
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

  const fetchClientGroups = async () => {
    try {
      const { data, error } = await supabase.from('client_groups').select('*');
      if (error) throw error;
      setClientGroups(data || []);
    } catch (error) {
      console.error('Error fetching client_groups:', error);
    }
  };

  const clientCountMap = clientGroups.reduce((acc: Record<string, number>, cg) => {
    if (cg.group_id) {
      acc[cg.group_id] = (acc[cg.group_id] || 0) + 1;
    }
    return acc;
  }, {});

  const filteredGroups = groups.filter((group) => {
    if (nameFilter && !group.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (locationFilter && group.location_id !== locationFilter) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, locationFilter]);

  const totalPages = Math.ceil(filteredGroups.length / rowsPerPage);
  const paginatedGroups = filteredGroups.slice(
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

  if (loading) return <div className="p-4 text-center">Loading groups...</div>;

  return (
    <div className="p-4 md:p-6">
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
          aria-label="Add Group"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      {/* Filtros (tabla view) */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4 p-4 bg-gray-50 rounded shadow-sm`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Filtrar por Nombre"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las Sedes</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Vista de tabla para tablet y desktop */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Nombre</th>
                <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Horario</th>
                <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Día(s)</th>
                <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Sede</th>
                <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Clientes</th>
                <th className="px-3 py-3.5 text-left font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedGroups.map((group) => (
                <tr
                  key={group.id}
                  onClick={() => onView(group.id)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-3 py-4 whitespace-nowrap text-gray-900">{group.name}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-900">{group.horario}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-900">{group.day_of_week}</td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                    {group.locations ? group.locations.name : '-'}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                    {clientCountMap[group.id] || 0}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-gray-900">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(group.id);
                      }}
                      className="mr-2 text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(group.id);
                      }}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedGroups.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-sm text-gray-500">
                    No se encontraron grupos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paginado para desktop */}
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
      {/* Vista en tarjetas para mobile */}
      <div className="block md:hidden">
        {paginatedGroups.map((group) => (
          <div key={group.id} className="bg-white shadow rounded p-4 mb-4">
            <h2 className="font-bold text-gray-900">{group.name}</h2>
            <p className="text-gray-700"><strong>Horario:</strong> {group.horario}</p>
            <p className="text-gray-700"><strong>Día(s):</strong> {group.day_of_week}</p>
            <p className="text-gray-700"><strong>Sede:</strong> {group.locations ? group.locations.name : '-'}</p>
            <p className="text-gray-700"><strong>Clientes:</strong> {clientCountMap[group.id] || 0}</p>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group.id);
                }}
                className="text-indigo-600 hover:text-indigo-900"
                aria-label="Editar"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(group.id);
                }}
                className="text-red-600 hover:text-red-900"
                aria-label="Eliminar"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {/* Paginado para mobile */}
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
          message="¿Estás seguro que quieres eliminar este grupo?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
