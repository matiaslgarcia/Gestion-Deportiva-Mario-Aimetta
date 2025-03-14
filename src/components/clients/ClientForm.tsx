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
    location_ids: [] as string[],
    group_ids: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [locations, setLocations] = useState<Location[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase.from('locations').select('*');
        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };

    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase.from('groups').select('*');
        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchLocations();
    fetchGroups();
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchClientData = async () => {
      if (client && client.id && !client.name) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', client.id)
          .single();
        if (error) {
          console.error('Error fetching client:', error);
        } else {
          updateFormData(data);
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
        group_ids: data.group_ids || []
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
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.surname.trim()) newErrors.surname = 'El apellido es requerido';
    if (!formData.dni.trim()) newErrors.dni = 'El DNI es requerido';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    if (!formData.birth_date) newErrors.birth_date = 'La fecha de nacimiento es requerida';
    if (!formData.payment_date) newErrors.payment_date = 'La fecha de pago es requerida';
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
    setErrors({}); // Limpiar errores
    try {
      if (client && client.id) {
        // Actualiza registro del cliente
        await supabase
          .from('clients')
          .update({
            name: formData.name,
            surname: formData.surname,
            dni: formData.dni,
            phone: formData.phone,
            birth_date: formData.birth_date,
            payment_date: formData.payment_date,
            method_of_payment: formData.method_of_payment
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
              dni: formData.dni,
              phone: formData.phone,
              birth_date: formData.birth_date,
              payment_date: formData.payment_date,
              method_of_payment: formData.method_of_payment
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
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Ocurrió un error al guardar el cliente');
    }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Alta de un Alumno</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
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
          <div>
            <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              id="surname"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
          </div>
          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI</label>
            <input
              type="text"
              id="dni"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono del Padre</label>
            <input
              type="text"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
        <fieldset className="border border-gray-200 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-700">Sedes</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            {locations.map(loc => (
              <div key={loc.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`loc-${loc.id}`}
                  checked={formData.location_ids.includes(loc.id)}
                  onChange={() => handleLocationChange(loc.id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 hover:border-indigo-500"
                />
                <label htmlFor={`loc-${loc.id}`} className="ml-2 text-sm text-gray-700">
                  {loc.name}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
        <fieldset className="border border-gray-200 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-700">Grupos</legend>
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
