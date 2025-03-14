// LocationList.tsx
import React, { useEffect, useState } from 'react';
import { Location } from '../../types';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../layout/ConfirmDialog';
import { Edit, Trash } from 'lucide-react';

interface LocationListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LocationList({ onView, onEdit, onDelete }: LocationListProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  // Filtros (omito otros filtros para simplificar)
  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Estados para el modal de confirmación
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejo del modal de confirmación
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
    if (nameFilter && !location.name.toLowerCase().includes(nameFilter.toLowerCase())) return false;
    if (addressFilter && !location.address.toLowerCase().includes(addressFilter.toLowerCase())) return false;
    // Filtrado por grupo si se requiere, usando un mapa de grupos, etc.
    return true;
  });

  if (loading) {
    return <div>Loading locations...</div>;
  }

  return (
    <div>
      {/* Filtros */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Filtrar por Nombre"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Filtrar por Dirección"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="border rounded p-2"
          />
          <input
            type="text"
            placeholder="Filtrar por Grupo"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border rounded p-2"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nombre</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dirección</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Teléfono</th>
              {/* Otras columnas */}
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLocations.map(location => (
              <tr key={location.id} onClick={() => onView(location.id)}>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{location.name}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{location.address}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{location.phone}</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(location.id);
                    }}
                    className="mr-2 text-indigo-600 hover:text-indigo-900"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(location.id);
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
