import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/layout/Sidebar';
import { LocationList } from './components/locations/LocationList';
import { LocationDetail } from './components/locations/LocationDetail';
import { LocationForm } from './components/locations/LocationForm';
import { ClientList } from './components/clients/ClientList';
import { ClientDetail } from './components/clients/ClientDetail';
import { ClientForm } from './components/clients/ClientForm';
import { GroupList } from './components/groups/GroupList';
import { GroupDetail } from './components/groups/GroupDetail';
import { GroupForm } from './components/groups/GroupForm';
import { PageHeader } from './components/shared/PageHeader';
import { supabase } from './lib/supabase';

type View = 'list' | 'detail' | 'form';

function App() {
  const [activeTab, setActiveTab] = useState<'locations' | 'clients' | 'groups' | 'clients-inactive'>('clients');
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (tab: 'locations' | 'clients' | 'groups' | 'clients-inactive') => {
    setActiveTab(tab);
    setView('list');
    setSelectedId(null);
  };

  const handleAdd = () => {
    setSelectedId(null);
    setView('form');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
  };

  const handleSave = async () => {
    setView('list');
    setRefreshKey(prev => prev + 1);
  };

  // Handler para eliminar grupos
  const handleDeleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('¡Grupo eliminado correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error eliminando grupo:', error);
    }
  };

  // Handler para eliminar sedes (locations)
  const handleDeleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('¡Sede eliminada correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error eliminando sede:', error);
    }
  };

  // Handler para eliminar clientes (eliminación lógica)
  const handleDeleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      toast.success('¡Alumno eliminado correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error eliminando alumno:', error);
    }
  };

  // Handler para habilitar clientes inactivos
  const handleEnableClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: true })
        .eq('id', id);
      if (error) throw error;
      toast.success('¡Alumno habilitado correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error habilitando alumno:', error);
    }
  };

  // Handler para ver clientes de un grupo
  const handleClientClick = (clientId: string) => {
    setActiveTab('clients');
    setSelectedId(clientId);
    setView('detail');
  };

  // Handler para ver grupos de una sede
  const handleLocationGroupClick = (groupId: string) => {
    setActiveTab('groups');
    setSelectedId(groupId);
    setView('detail');
  };

  // Handlers para ver y editar grupos
  const handleGroupView = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleGroupEdit = (id: string) => {
    setSelectedId(id);
    setView('form');
  };

  const handleClientEdit = (client: any) => {
    setSelectedId(client.id);
    setView('form');
  };

  const handleClientDelete = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId);
      if (error) throw error;
      toast.success('¡Alumno dado de baja correctamente!');
      setView('list');
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error dando de baja al alumno:', error);
      toast.error('Error al dar de baja al alumno');
    }
  };

  const renderContent = () => {
    if (activeTab === 'locations') {
      switch (view) {
        case 'list':
          return (
            <>
              <PageHeader
                title="Sedes"
                description="Listado de sedes disponibles."
                onAdd={handleAdd}
                addButtonText="Agregar Sede"
              />
              <LocationList
                key={refreshKey}
                onView={(id) => { setSelectedId(id); setView('detail'); }}
                onEdit={(id) => { setSelectedId(id); setView('form'); }}
                onDelete={handleDeleteLocation}
                onAdd={handleAdd}
              />
            </>
          );
        case 'detail':
          return selectedId ? (
            <LocationDetail
              locationId={selectedId}
              onBack={handleBack}
              onGroupClick={handleLocationGroupClick}
            />
          ) : null;
        case 'form':
          return (
            <LocationForm
              location={selectedId ? { id: selectedId } : undefined}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
      }
    } else if (activeTab === 'clients') {
      switch (view) {
        case 'list':
          return (
            <>
              <PageHeader
                title="Alumnos"
                description="Listado de alumnos activos."
                onAdd={handleAdd}
                addButtonText="Agregar Alumno"
              />
              <ClientList
                key={refreshKey}
                isActive={true}
                onView={(id) => { setSelectedId(id); setView('detail'); }}
                onEdit={(id) => { setSelectedId(id); setView('form'); }}
                onDelete={handleDeleteClient}
                onAdd={handleAdd}
              />
            </>
          );
        case 'detail':
          return selectedId ? (
            <ClientDetail 
              clientId={selectedId} 
              onBack={handleBack} 
              onEdit={handleClientEdit}
              onDelete={handleClientDelete}
            />
          ) : null;
        case 'form':
          return (
            <ClientForm
              client={selectedId ? { id: selectedId } : undefined}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
      }
    } else if (activeTab === 'clients-inactive') {
      switch (view) {
        case 'list':
          return (
            <>
              <PageHeader
                title="Alumnos Inactivos"
                description="Listado de alumnos inactivos."
                onAdd={handleAdd}
                addButtonText="Agregar Alumno"
              />
              <ClientList
                key={refreshKey}
                isActive={false}
                onView={(id) => { setSelectedId(id); setView('detail'); }}
                onEdit={(id) => { setSelectedId(id); setView('form'); }}
                onEnable={handleEnableClient}
                onDelete={handleDeleteClient}  // Opcional según se requiera
                onAdd={handleAdd}
              />
            </>
          );
        case 'detail':
          return selectedId ? (
            <ClientDetail clientId={selectedId} onBack={handleBack} />
          ) : null;
        case 'form':
          return (
            <ClientForm
              client={selectedId ? { id: selectedId } : undefined}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
      }
    } else if (activeTab === 'groups') {
      switch (view) {
        case 'list':
          return (
            <>
              <PageHeader
                title="Grupos"
                description="Listado de grupos de alumnos."
                onAdd={handleAdd}
                addButtonText="Agregar Grupo"
              />
              <GroupList
                key={refreshKey}
                onView={handleGroupView}
                onEdit={handleGroupEdit}
                onDelete={handleDeleteGroup}
                onAdd={handleAdd}
              />
            </>
          );
        case 'detail':
          return selectedId ? (
            <GroupDetail groupId={selectedId} onBack={handleBack} onClientClick={handleClientClick} />
          ) : null;
        case 'form':
          return (
            <GroupForm
              group={selectedId ? { id: selectedId } : undefined}
              onSave={handleSave}
              onCancel={handleBack}
            />
          );
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="flex-1 overflow-auto flex justify-center">
         <main className="py-6 px-4 sm:px-6 lg:px-8 mt-10 w-full max-w-7xl">
           <div className="bg-white shadow rounded-lg p-6 transition-all duration-300">
             {renderContent()}
           </div>
         </main>
        <Toaster position="top-right"/>
      </div>
    </div>
  );
}

export default App;
