import React, { useEffect, useState } from 'react';
import { Location } from '../../types';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Edit, Trash, Filter, Plus } from 'lucide-react';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { api } from '../../lib/api';

interface LocationListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function LocationList({ onView, onEdit, onDelete, onAdd }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtros
  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  // Estado para mostrar/ocultar filtros en mobile
  const [showFilters, setShowFilters] = useState(false);

  // Paginado
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await api.locations.list();
      setLocations(data || []);
    } catch {
        // Error silencioso al cargar ubicaciones
      } finally {
      setLoading(false);
    }
  };

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

  const filteredLocations = locations.filter(location => {
    if (nameFilter && location.name !== nameFilter) return false;
    if (addressFilter && !location.address.toLowerCase().includes(addressFilter.toLowerCase())) return false;
    // Filtrado por grupo si se requiere
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, addressFilter]);

  const totalPages = Math.ceil(filteredLocations.length / rowsPerPage);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (loading) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <div className="p-4 animate-fade-in">
      {/* Mobile header: icon buttons para filtros y agregar */}
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
          aria-label="Add Location"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
      {/* Filtros */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-4 p-4 bg-gray-50 rounded`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded p-2 text-sm"
          >
            <option value="">Todas las sedes</option>
            {locations.map(location => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filtrar por Dirección"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="border rounded p-2 text-sm"
          />
        </div>
      </div>
      {/* Vista de tabla para tablet y desktop */}
      <div className="hidden md:block">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gradient-to-r from-purple-600 to-violet-600">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-white">🏢 Nombre</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">📍 Dirección</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">📞 Teléfono</th>
                  <th className="px-4 py-4 text-left font-semibold text-white">⚙️ Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedLocations.map((location, index) => (
                  <tr key={location.id} onClick={() => onView(location.id)} className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 transition-all duration-200 cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900 font-medium">{location.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">{location.address}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-700">{location.phone}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-gray-900">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(location.id);
                        }}
                        className="mr-3 p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 hover:shadow-md"
                        title="Editar sede"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(location.id);
                        }}
                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md"
                        title="Eliminar sede"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedLocations.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl mb-2">🏢</div>
                        <p className="text-gray-500 text-sm font-medium">No se encontraron sedes</p>
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
        {paginatedLocations.map(location => (
          <div key={location.id} onClick={() => onView(location.id)} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {location.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{location.name}</h3>
                  <p className="text-gray-500 text-sm">🏢 Sede</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">📍 Dirección</p>
                <p className="text-gray-900 font-semibold">{location.address || '-'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 font-medium mb-1">📞 Teléfono</p>
                <p className="text-gray-900 font-semibold">{location.phone || '-'}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(location.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
              >
                <Edit className="h-4 w-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(location.id);
                }}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-md font-medium"
              >
                <Trash className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        ))}
        {paginatedLocations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏢</div>
            <p className="text-gray-500 text-lg font-medium">No se encontraron sedes</p>
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
          message="¿Estás seguro que quieres eliminar esta sede?"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
