import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Group, Location } from '../../types';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Edit, Trash, Filter, Plus } from 'lucide-react';
import { SkeletonLoader } from '../shared/SkeletonLoader';

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
        // Error silencioso al cargar grupos
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
        // Error silencioso al cargar ubicaciones
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
    if (nameFilter && group.name !== nameFilter) return false;
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

  if (loading) return <SkeletonLoader type="table" />;

  return (
    <div className="p-4 md:p-6 animate-fade-in">
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
      {/* Filtros (vista en tabla) */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4 p-4 bg-gray-50 rounded shadow-sm`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Se reemplaza el input por un select para filtrar por Nombre */}
          <select
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los Grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.name}>
                {group.name}
              </option>
            ))}
          </select>
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-green-600 to-emerald-600">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-white">👥 Nombre</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">⏰ Horario</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">📅 Día(s)</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">🏢 Sede</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">👤 Cantidad de Alumnos</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">⚙️ Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedGroups.map((group, index) => (
                  <tr
                    key={group.id}
                    onClick={() => onView(group.id)}
                    className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-medium">{group.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {group.horario ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {group.horario}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">{group.day_of_week}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      {group.locations ? group.locations.name : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {clientCountMap[group.id] || 0} alumnos
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(group.id);
                        }}
                        className="mr-3 p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 hover:shadow-md"
                        title="Editar grupo"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(group.id);
                        }}
                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md"
                        title="Eliminar grupo"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedGroups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl mb-2">👥</div>
                        <p className="text-gray-500 text-sm font-medium">No se encontraron grupos</p>
                        <p className="text-gray-400 text-xs mt-1">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
      {/* Vista de cards para móvil y tablet */}
      <div className="lg:hidden space-y-4">
        {paginatedGroups.map(group => (
          <div key={group.id} onClick={() => onView(group.id)} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {group.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                  <p className="text-gray-500 text-sm">👥 Grupo</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">⏰ Horario</p>
                <p className="text-gray-900 font-semibold">{group.horario || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">📅 Día(s)</p>
                <p className="text-gray-900 font-semibold">{group.day_of_week || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">🏢 Sede</p>
                <p className="text-gray-900 font-semibold">{group.locations ? group.locations.name : '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">👤 Alumnos</p>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {clientCountMap[group.id] || 0} alumnos
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(group.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
              >
                <Trash className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
        {paginatedGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-lg font-medium">No se encontraron grupos</p>
            <p className="text-gray-400 text-sm mt-2">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
        {/* Controles de paginado para mobile */}
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
