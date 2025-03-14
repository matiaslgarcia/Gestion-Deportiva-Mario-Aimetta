import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Group, Location } from '../../types';
import toast from 'react-hot-toast';

interface GroupFormProps {
  group?: Partial<Group>;
  onSave: () => void;
  onCancel: () => void;
}

export function GroupForm({ group, onSave, onCancel }: GroupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    horario: '',
    day_of_week: '',
    location_id: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const loadGroupData = async () => {
      if (group && group.id && !group.name) {
        try {
          const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', group.id)
            .single();
          if (error) {
            console.error('Error fetching group:', error);
          } else {
            setFormData({
              name: data.name || '',
              horario: data.horario || '',
              day_of_week: data.day_of_week || '',
              location_id: data.location_id || ''
            });
          }
        } catch (error) {
          console.error(error);
        }
      } else if (group) {
        setFormData({
          name: group.name || '',
          horario: group.horario || '',
          day_of_week: group.day_of_week || '',
          location_id: group.location_id || ''
        });
      }
    };

    fetchLocations();
    loadGroupData();
  }, [group]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.horario.trim()) newErrors.horario = 'El horario es requerido';
    if (!formData.day_of_week.trim()) newErrors.day_of_week = 'El día de clase es requerido';
    if (!formData.location_id) newErrors.location_id = 'La sede es requerida';
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
      if (group && group.id) {
        await supabase
          .from('groups')
          .update(formData)
          .eq('id', group.id);
        toast.success('Grupo actualizado correctamente');
      } else {
        await supabase
          .from('groups')
          .insert([formData]);
        toast.success('Grupo agregado correctamente');
      }
      onSave();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Ocurrió un error al guardar el grupo');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading locations...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Alta de un Grupo</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nombre del Grupo
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="horario" className="block text-sm font-medium text-gray-700">
              Horario
            </label>
            <input
              type="text"
              id="horario"
              value={formData.horario}
              onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: 17:30-19:00"
              required
            />
            {errors.horario && <p className="text-red-500 text-xs mt-1">{errors.horario}</p>}
          </div>
          <div>
            <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">
              Día(s) de Clase
            </label>
            <input
              type="text"
              id="day_of_week"
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Martes y Jueves"
              required
            />
            {errors.day_of_week && <p className="text-red-500 text-xs mt-1">{errors.day_of_week}</p>}
          </div>
          <div>
            <label htmlFor="location_id" className="block text-sm font-medium text-gray-700">
              Sede
            </label>
            <select
              id="location_id"
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Seleccione una sede</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
            {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id}</p>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto py-2 px-4 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}
