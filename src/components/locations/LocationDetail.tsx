import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Location } from '../../types';
import { Loader } from '../layout/Loader';

interface LocationDetailProps {
  locationId: string;
  onBack: () => void;
  onGroupClick: (groupId: string) => void;
}

export function LocationDetail({ locationId, onBack, onGroupClick }: LocationDetailProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();
      if (error) console.error(error);
      else setLocation(data);
    };

    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('location_id', locationId);
        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups for location:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
    fetchGroups();
  }, [locationId]);

  if (loading)
    return <Loader message="Cargando Información de la Sede" />;
  if (!location)
    return <div className="p-4 text-center text-sm text-gray-700">Sede no encontrada</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-xl p-6 sm:p-8">
        {/* Header con botón de volver */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 mr-4 transition-colors"
          >
            <ChevronRight className="h-6 w-6 transform rotate-180" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
        </div>
        {/* Información de la sede */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-600">Dirección</h3>
              <p className="mt-1 text-sm text-gray-800">{location.address}</p>
            </div>
            <div className="flex-1 mt-4 md:mt-0">
              <h3 className="text-sm font-medium text-gray-600">Teléfono</h3>
              <p className="mt-1 text-sm text-gray-800">{location.phone}</p>
            </div>
          </div>
        </div>
        {/* Grupos asignados */}
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Grupos Asignados</h3>
          {groups.length > 0 ? (
            <>
              {/* Vista en tabla para desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Nombre</th>
                      <th className="px-4 py-2 text-left">Horario</th>
                      <th className="px-4 py-2 text-left">Día(s)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groups.map(grp => (
                      <tr
                        key={grp.id}
                        onClick={() => onGroupClick(grp.id)}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-2">{grp.name}</td>
                        <td className="px-4 py-2">{grp.horario || '-'}</td>
                        <td className="px-4 py-2">{grp.day_of_week || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Vista en tarjetas para mobile */}
              <div className="block md:hidden space-y-4">
                {groups.map(grp => (
                  <div
                    key={grp.id}
                    onClick={() => onGroupClick(grp.id)}
                    className="bg-white shadow rounded-lg p-4 cursor-pointer border border-gray-200"
                  >
                    <p className="text-blue-600 underline font-bold">{grp.name}</p>
                    <p className="text-sm mt-1"><span className="font-medium">Horario:</span> {grp.horario || '-'}</p>
                    <p className="text-sm mt-1"><span className="font-medium">Día(s):</span> {grp.day_of_week || '-'}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-800">No hay grupos asignados</p>
          )}
        </div>
      </div>
    </div>
  );
}
