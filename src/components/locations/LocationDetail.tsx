import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Location } from '../../types';

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

  if (loading) return <div>Cargando Sede...</div>;
  if (!location) return <div>Sede no encontrada</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700 mr-4">
          <ChevronRight className="h-6 w-6 transform rotate-180" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{location.name}</h2>
      </div>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <dt className="text-sm font-medium text-gray-600">Dirección</dt>
          <dd className="mt-1 text-sm text-gray-800">{location.address}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-gray-600">Teléfono</dt>
          <dd className="mt-1 text-sm text-gray-800">{location.phone}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-sm font-medium text-gray-600">Grupos Asignados</dt>
          <dd className="mt-1 text-sm text-gray-800">
            {groups.length > 0 ? groups.map(grp => grp.name).join(', ') : 'No hay grupos asignados'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
