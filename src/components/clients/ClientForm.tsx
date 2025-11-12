import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Client, Location, Group } from '../../types';
import toast from 'react-hot-toast';

interface ClientFormProps {
  client?: Partial<Client>;
  onSave: () => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    dni: '',
    phone: '',
    birth_date: '',
    payment_date: '',
    method_of_payment: 'efectivo',
    direction: '',
    location_ids: [] as string[],
    group_ids: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [locations, setLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeComponent = async () => {
      try {

        await Promise.all([fetchLocations(), fetchGroups()]);
      } catch (error) {
         // Error silencioso durante la inicialización
         toast.error('Error al inicializar el formulario');
      } finally {
        setLoading(false);
      }
    };

    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from('locations').select('*');
        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
         // Error silencioso al cargar ubicaciones
         throw error;
      }
    };

    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase.from('groups').select('*');
        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
         // Error silencioso al cargar grupos
         throw error;
      }
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    const fetchClientData = async () => {
      if (client && client.id && !client.name) {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            client_locations (
              location_id
            ),
            client_groups (
              group_id
            )
          `)
          .eq('id', client.id)
          .single();
        
        if (error) {
        } else {
          const locationIds = data.client_locations?.map((cl: { location_id: string }) => cl.location_id) || [];
          const groupIds = data.client_groups?.map((cg: { group_id: string }) => cg.group_id) || [];
          
          updateFormData({
            ...data,
            location_ids: locationIds,
            group_ids: groupIds
          });
        }
      } else if (client) {
        updateFormData(client);
      }
    };

    const updateFormData = (data: Partial<Client>) => {
      setFormData({
        name: data.name || '',
        surname: data.surname || '',
        dni: data.dni || '',
        phone: data.phone || '',
        birth_date: data.birth_date || '',
        payment_date: data.payment_date || '',
        method_of_payment: data.method_of_payment || 'efectivo',
        location_ids: data.location_ids || [],
        group_ids: data.group_ids || [],
        direction: data.direction || '',
      });
    };

    if (client) {
      fetchClientData();
    }
  }, [client]);

  const handleLocationChange = (locationId: string) => {
    setFormData(prev => {
      const newLocationIds = prev.location_ids.includes(locationId)
        ? prev.location_ids.filter(id => id !== locationId)
        : [...prev.location_ids, locationId];
      return { ...prev, location_ids: newLocationIds };
    });
  };

  const handleGroupChange = (groupId: string) => {
    setFormData(prev => {
      const newGroupIds = prev.group_ids.includes(groupId)
        ? prev.group_ids.filter(id => id !== groupId)
        : [...prev.group_ids, groupId];
      return { ...prev, group_ids: newGroupIds };
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Validación de nombre
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'El nombre solo puede contener letras y espacios';
    }
    
    // Validación de apellido
    if (!formData.surname.trim()) {
      newErrors.surname = 'El apellido es obligatorio';
    } else if (formData.surname.trim().length < 2) {
      newErrors.surname = 'El apellido debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.surname.trim())) {
      newErrors.surname = 'El apellido solo puede contener letras y espacios';
    }
    
    // Validación de DNI
    const dniDigits = formData.dni.trim().replace(/\D/g, '');
    if (!dniDigits) {
      newErrors.dni = 'El DNI es obligatorio';
    } else if (!/^\d{7,8}$/.test(dniDigits)) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos numéricos';
    }
    
    // Validación de fecha de nacimiento
    if (!formData.birth_date) {
      newErrors.birth_date = 'La fecha de nacimiento es obligatoria';
    } else {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 3 || age > 120) {
        newErrors.birth_date = 'La edad debe estar entre 3 y 120 años';
      }
    }
    
    // Validación de teléfono
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 8 || phoneDigits.length > 30) {
        newErrors.phone = 'El teléfono debe contener entre 8 y 30 dígitos';
      }
    }
    
    // Validación de dirección
    if (!formData.direction.trim()) {
      newErrors.direction = 'La dirección es obligatoria';
    } else if (formData.direction.trim().length < 5) {
      newErrors.direction = 'La dirección debe tener al menos 5 caracteres';
    }
    
    // Validación de fecha de pago
    if (!formData.payment_date) {
      newErrors.payment_date = 'La fecha de pago es obligatoria';
    }
    
    return newErrors;
  };

  const checkDniExists = async (dni: string, excludeId?: string): Promise<boolean> => {
    try {
      const digits = dni.replace(/\D/g, '');
      let dotted = '';
      if (digits) {
        if (digits.length <= 3) {
          dotted = digits;
        } else if (digits.length <= 6) {
          dotted = `${digits.slice(0, digits.length - 3)}.${digits.slice(digits.length - 3)}`;
        } else {
          dotted = `${digits.slice(0, digits.length - 6)}.${digits.slice(digits.length - 6, digits.length - 3)}.${digits.slice(digits.length - 3)}`;
        }
      }
      let query = supabase.from('clients').select('id');
      if (dotted) {
        query = query.or(`dni.eq.${digits},dni.eq.${dotted}`);
      } else {
        query = query.eq('dni', digits);
      }
      
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        // Error silencioso al verificar DNI
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      // Error silencioso al verificar DNI
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
    setErrors({}); // Limpiar errores
    
    // Verificar si el DNI ya existe
    const dniExists = await checkDniExists(formData.dni, client?.id);
    if (dniExists) {
      setErrors({ dni: 'Ya existe un cliente con este DNI' });
      toast.error('Ya existe un cliente con este DNI. Por favor, verifica el número de documento.');
      return;
    }
    
    try {
      if (client && client.id) {
        // Actualiza registro del cliente
        await supabase
          .from('clients')
          .update({
            name: formData.name,
            surname: formData.surname,
            dni: formData.dni.replace(/\D/g, ''),
            phone: formData.phone,
            birth_date: formData.birth_date,
            payment_date: formData.payment_date,
            method_of_payment: formData.method_of_payment,
            direction: formData.direction
          })
          .eq('id', client.id);

        // Actualiza client_locations
        await supabase
          .from('client_locations')
          .delete()
          .eq('client_id', client.id);

        if (formData.location_ids.length > 0) {
          const clientLocations = formData.location_ids.map(locationId => ({
            client_id: client.id,
            location_id: locationId
          }));
          await supabase.from('client_locations').insert(clientLocations);
        }

        // Actualiza client_groups
        await supabase
          .from('client_groups')
          .delete()
          .eq('client_id', client.id);

        if (formData.group_ids.length > 0) {
          const clientGroups = formData.group_ids.map(groupId => ({
            client_id: client.id,
            group_id: groupId
          }));
          await supabase.from('client_groups').insert(clientGroups);
        }
        toast.success('Cliente actualizado correctamente');
      } else {
        // Inserta nuevo cliente
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
              .insert([
                {
                  name: formData.name,
                  surname: formData.surname,
                  dni: formData.dni.replace(/\D/g, ''),
                  phone: formData.phone,
                  birth_date: formData.birth_date,
                  payment_date: formData.payment_date,
                  method_of_payment: formData.method_of_payment,
                  direction: formData.direction
                }
              ])
          .select()
          .single();
        if (clientError) throw clientError;

        if (newClient) {
          if (formData.location_ids.length > 0) {
            const clientLocations = formData.location_ids.map(locationId => ({
              client_id: newClient.id,
              location_id: locationId
            }));
            await supabase.from('client_locations').insert(clientLocations);
          }
          if (formData.group_ids.length > 0) {
            const clientGroups = formData.group_ids.map(groupId => ({
              client_id: newClient.id,
              group_id: groupId
            }));
            await supabase.from('client_groups').insert(clientGroups);
          }
          toast.success('Cliente agregado correctamente');
        }
      }
      onSave();
    } catch (error: any) {
      // Error capturado al guardar cliente
      
      // Manejo específico de errores
      if (error?.status === 409 || error?.statusCode === 409 || 
          error?.code === '23505' ||
          error?.message?.toLowerCase().includes('duplicate') ||
          error?.message?.toLowerCase().includes('unique') ||
          error?.message?.toLowerCase().includes('dni')) {
        setErrors({ dni: 'Ya existe un cliente con este DNI. Por favor, verifica el número de documento.' });
        toast.error('Ya existe un cliente con este DNI. Por favor, verifica el número de documento.');
      } else if (error?.code === '23503') {
        toast.error('Error de referencia en la base de datos. Verifique que los grupos seleccionados sean válidos.');
      } else if (error?.message?.includes('name')) {
        setErrors({ name: 'Error con el nombre del cliente' });
        toast.error('Error con el nombre del cliente');
      } else if (error?.message?.includes('phone')) {
        setErrors({ phone: 'Error con el número de teléfono' });
        toast.error('Error con el número de teléfono');
      } else if (error?.message?.includes('email')) {
        setErrors({ email: 'Error con el email' });
        toast.error('Error con el email');
      } else if (error?.message?.includes('birth_date')) {
        setErrors({ birth_date: 'Error con la fecha de nacimiento' });
        toast.error('Error con la fecha de nacimiento');
      } else {
        toast.error('Ocurrió un error al guardar el cliente. Verifique los datos e intente nuevamente.');
      }
    }
  };

  const formatDni = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, digits.length - 3)}.${digits.slice(digits.length - 3)}`;
    return `${digits.slice(0, digits.length - 6)}.${digits.slice(digits.length - 6, digits.length - 3)}.${digits.slice(digits.length - 3)}`;
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
      <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl rounded-2xl overflow-hidden border border-gray-200">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">Alta de un Alumno</h2>
          <p className="text-blue-100 text-center mt-2">Complete la información del nuevo alumno</p>
            </div>
        
        {/* Contenido del formulario */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6 card-modern glass">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 px-4 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300"
                  placeholder="Ingrese el nombre (solo letras)"
                  required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center"><span className="mr-1">⚠️</span>{errors.name}</p>}
              </div>
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              id="surname"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ingrese el apellido (solo letras)"
              required
            />
            {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
          </div>
          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI</label>
            <input
              type="text"
              id="dni"
              value={formatDni(formData.dni)}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, '') })}
              inputMode="numeric"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ingrese DNI (xx.xxx.xxx o 7/8 dígitos)"
              required
            />
            {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono del Padre/Madre</label>
          <input
            type="text"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ej: XXXXXXXXXX Fulano "
            required
          />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label htmlFor="direction" className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              id="direction"
              value={formData.direction}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ingrese dirección completa (mín. 5 caracteres)"
              required
            />
            {errors.direction && <p className="text-red-500 text-xs mt-1">{errors.direction}</p>}
          </div>         
          <div>
            <label htmlFor="method_of_payment" className="block text-sm font-medium text-gray-700">Método de Pago</label>
            <select
              id="method_of_payment"
              value={formData.method_of_payment}
              onChange={(e) => setFormData({ ...formData, method_of_payment: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </div>
          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
            <input
              type="date"
              id="birth_date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.birth_date && <p className="text-red-500 text-xs mt-1">{errors.birth_date}</p>}
          </div>
          <div>
            <label htmlFor="payment_date" className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
            <input
              type="date"
              id="payment_date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.payment_date && <p className="text-red-500 text-xs mt-1">{errors.payment_date}</p>}
          </div>
        </div>
            <fieldset className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 p-6 rounded-xl">
              <legend className="text-lg font-semibold text-gray-800 px-3">🏢 Sedes</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`loc-${loc.id}`}
                  checked={formData.location_ids.includes(loc.id)}
                  onChange={() => handleLocationChange(loc.id)}
                  className="h-5 w-5 text-indigo-600 border-gray-300 rounded-md focus:ring-indigo-500 hover:border-indigo-500 transition-colors duration-200"
                />
                <label htmlFor={`loc-${loc.id}`} className="ml-3 text-sm font-medium text-gray-700 cursor-pointer hover:text-indigo-600 transition-colors duration-200">
                  {loc.name}
                </label>
              </div>
            ))}
              </div>
            </fieldset>
            <fieldset className="bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 p-6 rounded-xl">
              <legend className="text-lg font-semibold text-gray-800 px-3">👥 Grupos</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {groups.map(grp => (
              <div key={grp.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`grp-${grp.id}`}
                  checked={formData.group_ids.includes(grp.id)}
                  onChange={() => handleGroupChange(grp.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 hover:border-indigo-500"
                />
                <label htmlFor={`grp-${grp.id}`} className="ml-2 text-sm text-gray-700">
                  {grp.name}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 px-6 pb-6">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto py-3 px-6 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hover-lift"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto py-3 px-6 btn-gradient text-white rounded-xl disabled:opacity-50 transition-all duration-200 hover-lift animate-glow"
              >
                {loading ? 'Guardando...' : (client ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
