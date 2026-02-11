import React, { useState, useEffect } from 'react';
import { Location } from '../../types';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocationData = async () => {
      if (location && location.id && !location.name) {
        try {
          const { location: data } = await api.locations.get(location.id, false);
          setFormData({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || ''
          });
        } catch {
          // Error silencioso al cargar datos de ubicación
        }
      } else if (location) {
        setFormData({
          name: location.name || '',
          address: location.address || '',
          phone: location.phone || ''
        });
      }
    };

    loadLocationData().finally(() => setLoading(false));
  }, [location]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la sede es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'La dirección debe tener al menos 5 caracteres';
    }
    
    if (formData.phone.trim() && !/^[\d\s\-+()]+$/.test(formData.phone.trim())) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }
    
    setErrors({});
    
    try {
      if (location && location.id) {
        await api.locations.update(location.id, formData);
        toast.success('Sede actualizada correctamente');
      } else {
        await api.locations.create(formData);
        toast.success('Sede agregada correctamente');
      }
      onSave();
    } catch (error: unknown) {
       // Error capturado al guardar ubicación
      
      // Manejo específico de errores
      const message = (() => {
        if (!error || typeof error !== 'object') return '';
        if (!('message' in error)) return '';
        const msg = (error as { message?: unknown }).message;
        return typeof msg === 'string' ? msg : '';
      })();

      if (message.toLowerCase().includes('ya existe')) {
        setErrors({ name: 'Ya existe una sede con este nombre' });
        toast.error('Ya existe una sede con este nombre');
      } else if (message.includes('name')) {
        setErrors({ name: 'Error con el nombre de la sede' });
        toast.error('Error con el nombre de la sede');
      } else if (message.includes('address')) {
        setErrors({ address: 'Error con la dirección' });
        toast.error('Error con la dirección');
      } else {
        toast.error('Ocurrió un error al guardar la sede. Verifique los datos e intente nuevamente.');
      }
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">Alta de una Sede</h2>
          <p className="text-purple-100 text-center mt-2">Configure la información de la nueva sede</p>
            </div>
        
        {/* Contenido del formulario */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 card-modern glass p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">🏢 Nombre de la Sede</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                  placeholder="Ingrese el nombre de la sede"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><span className="mr-1">⚠️</span>{errors.name}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">📍 Dirección</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                  placeholder="Ingrese la dirección"
                  required
                />
                {errors.address && <p className="text-red-500 text-xs mt-1 flex items-center"><span className="mr-1">⚠️</span>{errors.address}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">📞 Teléfono</label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300"
                  placeholder="Ingrese el teléfono"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center"><span className="mr-1">⚠️</span>{errors.phone}</p>}
              </div>
        </div>
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto py-3 px-6 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-sm hover-lift"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto py-3 px-6 btn-gradient text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover-lift animate-glow"
              >
                🏢 Guardar Sede
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
