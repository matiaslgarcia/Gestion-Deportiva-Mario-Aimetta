import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Location } from '../../types';
import { Loader } from '../layout/Loader';

interface LocationDetailProps {
  locationId: string;
  onBack: () => void;
}

export function LocationDetail({ locationId, onBack }: LocationDetailProps) {
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
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 mr-4 transition-colors"
          >
            <ChevronRight className="h-6 w-6 transform rotate-180" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
        </div>
        <dl className="divide-y divide-gray-200">
          <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-600">Dirección</dt>
              <dd className="mt-1 text-sm text-gray-800">{location.address}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Teléfono</dt>
              <dd className="mt-1 text-sm text-gray-800">{location.phone}</dd>
            </div>
          </div>
          <div className="py-4">
            <dt className="text-sm font-medium text-gray-600">Grupos Asignados</dt>
            <dd className="mt-1">
              {groups.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {groups.map(grp => (
                    <li key={grp.id} className="text-sm text-gray-800">
                      {grp.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-800">No hay grupos asignados</p>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
