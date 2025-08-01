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
      if (error) {
        // Error silencioso al cargar ubicación
      }
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
        // Error silencioso al cargar grupos
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
    <div className="max-w-6xl mx-auto p-6 animate-fade-in">
      <div className="card-modern glass overflow-hidden hover-lift">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="text-white/80 hover:text-white mr-4 p-2 rounded-full hover:bg-white/10 transition-all duration-200 hover-lift animate-glow"
            >
              <ChevronRight className="h-6 w-6 transform rotate-180" />
            </button>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">{location.name}</h2>
              <p className="text-emerald-100 mt-1">Información de la Sede</p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 sm:p-8">
          {/* Información de la sede */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-3"></div>
              Información de la Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Dirección</dt>
                <dd className="text-lg font-semibold text-gray-900">{location.address}</dd>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <dt className="text-sm font-medium text-gray-500 mb-1">Teléfono</dt>
                <dd className="text-lg font-semibold text-gray-900">{location.phone}</dd>
              </div>
            </div>
          </div>
          {/* Grupos asignados */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full mr-3"></div>
              Grupos Asignados
            </h3>
            {groups.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500">No hay grupos asignados a esta sede.</p>
              </div>
            ) : (
              <>
                {/* Vista de escritorio */}
                <div className="hidden md:block">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Horario
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Alumnos
                          </th>

                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {groups.map((group) => (
                          <tr
                            key={group.id}
                            onClick={() => onGroupClick(group.id)}
                            className="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 cursor-pointer transition-all duration-200 group"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
                              {group.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {group.schedule}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {group.student_count || 0} alumnos
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Vista móvil */}
                <div className="md:hidden space-y-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => onGroupClick(group.id)}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg">{group.name}</h4>
                        <span className="text-lg font-bold text-emerald-600">${group.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{group.schedule}</p>
                      <div className="flex justify-between items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {group.student_count || 0} alumnos
                        </span>
                        <div className="text-emerald-600">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
