import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Location, Group } from '../../types';
import toast from 'react-hot-toast';

interface LocationFormProps {
  location?: Partial<Location>;
  onSave: () => void;
  onCancel: () => void;
}

export function LocationForm({ location, onSave, onCancel }: LocationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase.from('groups').select('*');
        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    const loadLocationData = async () => {
      if (location && location.id && !location.name) {
        try {
          const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('id', location.id)
            .single();
          if (error) {
            console.error('Error fetching location:', error);
          } else {
            setFormData({
              name: data.name || '',
              address: data.address || '',
              phone: data.phone || ''
            });
          }
        } catch (error) {
          console.error(error);
        }
      } else if (location) {
        setFormData({
          name: location.name || '',
          address: location.address || '',
          phone: location.phone || ''
        });
      }
    };

    Promise.all([fetchGroups(), loadLocationData()]).finally(() => setLoading(false));
  }, [location]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    // Aquí se puede agregar validación para teléfono si es requerido.
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Complete los campos requeridos');
      return;
    }
    setErrors({});
    try {
      if (location && location.id) {
        await supabase
          .from('locations')
          .update(formData)
          .eq('id', location.id);
        toast.success('Sede actualizada correctamente');
      } else {
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        toast.success('Sede agregada correctamente');
      }
      onSave();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Ocurrió un error al guardar la sede');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Alta de una Sede</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="text"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        <fieldset className="border border-gray-200 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-700">Asignación de Grupos</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {groups.map(grp => (
              <div key={grp.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`grp-${grp.id}`}
                  checked={selectedGroupIds.includes(grp.id)}
                  onChange={() => setSelectedGroupIds(prev =>
                    prev.includes(grp.id) ? prev.filter(id => id !== grp.id) : [...prev, grp.id]
                  )}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 hover:border-indigo-500"
                />
                <label htmlFor={`grp-${grp.id}`} className="ml-2 text-sm text-gray-700">
                  {grp.name}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
