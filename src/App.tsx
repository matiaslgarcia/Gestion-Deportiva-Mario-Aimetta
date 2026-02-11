import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
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
import { Breadcrumbs } from './components/shared/Breadcrumbs';
import { api } from './lib/api';

type View = 'list' | 'detail' | 'form';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'locations' | 'clients' | 'groups' | 'clients-inactive'>('dashboard');
  const [view, setView] = useState<View>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Inicializar tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleTabChange = (tab: 'dashboard' | 'locations' | 'clients' | 'groups' | 'clients-inactive') => {
    console.log('handleTabChange called with:', tab);
    setActiveTab(tab);
    setView('list');
    setSelectedId(null);
  };

  const handleAdd = () => {
    console.log('handleAdd called - activeTab:', activeTab, 'current view:', view);
    setSelectedId(null);
    setView('form');
    console.log('handleAdd completed - new view should be: form');
  };

  const handleBack = () => {
    console.log('handleBack called');
    setView('list');
    setSelectedId(null);
  };

  const handleSave = async () => {
    console.log('handleSave called');
    setView('list');
    setRefreshKey(prev => prev + 1);
  };

  // Handler para eliminar grupos
  const handleDeleteGroup = async (id: string) => {
    try {
      await api.groups.delete(id);
      toast.success('¡Grupo eliminado correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch {
      // Error capturado al eliminar grupo
      toast.error('Error al eliminar el grupo');
    }
  };

  // Handler para eliminar sedes (locations)
  const handleDeleteLocation = async (id: string) => {
    try {
      await api.locations.delete(id);
      toast.success('¡Sede eliminada correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch {
      // Error capturado al eliminar sede
      toast.error('Error al eliminar la sede');
    }
  };

  // Handler para eliminar clientes (eliminación lógica)
  const handleDeleteClient = async (id: string) => {
    try {
      await api.clients.patch(id, { is_active: false });
      toast.success('¡Alumno eliminado correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch {
      // Error capturado al eliminar alumno
      toast.error('Error al eliminar el alumno');
    }
  };

  // Handler para habilitar clientes inactivos
  const handleEnableClient = async (id: string) => {
    try {
      await api.clients.patch(id, { is_active: true });
      toast.success('¡Alumno habilitado correctamente!');
      setRefreshKey(prev => prev + 1);
    } catch {
      // Error capturado al habilitar alumno
      toast.error('Error al habilitar el alumno');
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

  const handleClientEdit = (client: { id: string }) => {
    setSelectedId(client.id);
    setView('form');
  };

  const handleClientDelete = async (clientId: string) => {
    try {
      await api.clients.patch(clientId, { is_active: false });
      toast.success('¡Alumno dado de baja correctamente!');
      setView('list');
      setRefreshKey(prev => prev + 1);
    } catch {
        // Error capturado al dar de baja alumno
        toast.error('Error al dar de baja al alumno');
      }
  };

  const renderContent = () => {
    console.log('renderContent called - activeTab:', activeTab, 'view:', view, 'selectedId:', selectedId);
    if (activeTab === 'dashboard') {
      return <Dashboard onClientClick={handleClientClick} />;
    } else if (activeTab === 'locations') {
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

  // Generar breadcrumbs
  const getBreadcrumbs = () => {
    const items = [];
    
    if (activeTab !== 'dashboard') {
      items.push({
        label: getTabLabel(activeTab),
        onClick: view !== 'list' ? () => handleBack() : undefined,
        active: view === 'list'
      });
    }
    
    if (view === 'detail') {
      items.push({
        label: 'Detalles',
        active: true
      });
    } else if (view === 'form') {
      items.push({
        label: selectedId ? 'Editar' : 'Nuevo',
        active: true
      });
    }
    
    return items;
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'clients': return 'Alumnos Activos';
      case 'clients-inactive': return 'Alumnos Inactivos';
      case 'groups': return 'Grupos';
      case 'locations': return 'Sedes';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="md:pl-72">
        <main className="p-6 animate-fade-in">
          {/* Breadcrumbs */}
          {activeTab !== 'dashboard' && (
            <Breadcrumbs 
              items={getBreadcrumbs()}
            />
          )}
          
          {renderContent()}
        </main>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            className: 'glass rounded-2xl border border-white/20 shadow-2xl',
            style: {
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(16px)',
              color: '#1f2937',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
              },
            },
            loading: {
              iconTheme: {
                primary: '#6366f1',
                secondary: '#fff',
              },
              style: {
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.1))',
              },
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
