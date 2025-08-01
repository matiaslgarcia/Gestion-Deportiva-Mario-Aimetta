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
        // Error silencioso al cargar ubicaciones
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
            // Error silencioso al cargar grupo
          } else {
            setFormData({
              name: data.name || '',
              horario: data.horario || '',
              day_of_week: data.day_of_week || '',
              location_id: data.location_id || ''
            });
          }
        } catch (error) {
          // Error silencioso al cargar datos del grupo
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del grupo es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.horario.trim()) {
      newErrors.horario = 'El horario es obligatorio';
    } else if (!/^\d{1,2}:\d{2}(-\d{1,2}:\d{2})?/.test(formData.horario.trim())) {
      newErrors.horario = 'Formato de horario inválido. Use formato HH:MM o HH:MM-HH:MM';
    }
    
    if (!formData.day_of_week.trim()) {
      newErrors.day_of_week = 'El día de clase es obligatorio';
    }
    
    if (!formData.location_id) {
      newErrors.location_id = 'Debe seleccionar una sede';
    }
    
    return newErrors;
  };

  const checkGroupExists = async (name: string, excludeId?: string) => {
    try {
      let query = supabase
        .from('groups')
        .select('id')
        .ilike('name', name.trim());
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return data && data.length > 0;
    } catch (error) {
       // Error silencioso al verificar existencia del grupo
       return false;
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }
    
    // Verificar si ya existe un grupo con el mismo nombre
    const groupExists = await checkGroupExists(formData.name, group?.id);
    if (groupExists) {
      setErrors({ name: 'Ya existe un grupo con este nombre' });
      toast.error('Ya existe un grupo con este nombre');
      return;
    }
    
    setErrors({});
    
    try {
      if (group && group.id) {
        const { error } = await supabase
          .from('groups')
          .update(formData)
          .eq('id', group.id);
        
        if (error) throw error;
        toast.success('Grupo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('groups')
          .insert([formData]);
        
        if (error) throw error;
        toast.success('Grupo agregado correctamente');
      }
      onSave();
    } catch (error: any) {
       // Error capturado al guardar grupo
      
      // Manejo específico de errores
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        setErrors({ name: 'Ya existe un grupo con este nombre' });
        toast.error('Ya existe un grupo con este nombre');
      } else if (error?.code === '23503') {
        setErrors({ location_id: 'La sede seleccionada no es válida' });
        toast.error('La sede seleccionada no es válida');
      } else if (error?.message?.includes('location_id')) {
        setErrors({ location_id: 'Error con la sede seleccionada' });
        toast.error('Error con la sede seleccionada');
      } else {
        toast.error('Ocurrió un error al guardar el grupo. Verifique los datos e intente nuevamente.');
      }
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
