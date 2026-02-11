import React, { useEffect, useState } from 'react';
import { Client } from '../../types';
import { getPaymentStatusColor } from '../../utils/paymentStatus';
import { Users, CheckCircle, AlertCircle, Clock, Search, ChevronRight, Eye, TrendingUp, Activity } from 'lucide-react';
import { SkeletonLoader } from '../shared/SkeletonLoader';
import { format} from 'date-fns';
import { api } from '../../lib/api';

interface DashboardMetrics {
  totalActiveClients: number;
  clientsUpToDate: number;
  clientsOverdue: number;
  clientsDueSoon: number;
}

interface ClientWithPaymentStatus extends Client {
  paymentStatus: 'green' | 'yellow' | 'red';
  daysUntilDue?: number;
}

interface DashboardProps {
  onClientClick?: (clientId: string) => void;
}

export function Dashboard({ onClientClick }: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalActiveClients: 0,
    clientsUpToDate: 0,
    clientsOverdue: 0,
    clientsDueSoon: 0
  });
  const [overdueClients, setOverdueClients] = useState<ClientWithPaymentStatus[]>([]);
  const [dueSoonClients, setDueSoonClients] = useState<ClientWithPaymentStatus[]>([]);
  const [upToDateClients, setUpToDateClients] = useState<ClientWithPaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para navegación y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllDueSoon, setShowAllDueSoon] = useState(false);
  const [showAllUpToDate, setShowAllUpToDate] = useState(false);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener todos los clientes activos
      const clients = await api.dashboard.getClients();

      const clientsWithStatus: ClientWithPaymentStatus[] = (clients || []).map((client) => {
        const paymentStatus = getPaymentStatusColor(client.payment_date, client.last_payment);
        const normalizedClient: Client = {
          id: client.id,
          name: client.name,
          surname: client.surname,
          dni: client.dni,
          phone: client.phone,
          birth_date: client.birth_date,
          payment_date: client.payment_date,
          last_payment: client.last_payment,
          method_of_payment: client.method_of_payment,
          payment_status: client.payment_status,
          direction: client.direction,
          location_ids: client.location_ids ?? [],
          group_ids: client.group_ids ?? [],
          created_at: client.created_at,
          updated_at: client.updated_at
        };
        return { ...normalizedClient, paymentStatus };
      });

      // Calcular métricas
      const totalActive = clientsWithStatus.length;
      const upToDate = clientsWithStatus.filter(c => c.paymentStatus === 'green').length;
      const overdue = clientsWithStatus.filter(c => c.paymentStatus === 'red').length;
      const dueSoon = clientsWithStatus.filter(c => c.paymentStatus === 'yellow').length;

      setMetrics({
        totalActiveClients: totalActive,
        clientsUpToDate: upToDate,
        clientsOverdue: overdue,
        clientsDueSoon: dueSoon
      });

      // Filtrar clientes por estado de pago
      setOverdueClients(clientsWithStatus.filter(c => c.paymentStatus === 'red'));
      setDueSoonClients(clientsWithStatus.filter(c => c.paymentStatus === 'yellow'));
      setUpToDateClients(clientsWithStatus.filter(c => c.paymentStatus === 'green'));

    } catch {
      // Error silencioso al cargar datos del dashboard
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 animate-pulse-soft">Dashboard</h1>
          <p className="text-indigo-100 text-lg">Resumen general de tu escuela de fútbol</p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Alumnos Activos */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-blue-200 hover-lift animate-fade-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg animate-pulse-soft">
              <Users className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-blue-700">Alumnos Activos</p>
              <p className="text-2xl lg:text-3xl font-bold text-blue-900 animate-pulse-soft">{metrics.totalActiveClients}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
                <span className="text-xs text-blue-600 font-medium">Activos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagos al Día */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-green-200 hover-lift animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg animate-pulse-soft">
              <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-green-700">Pagos al Día</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-900 animate-pulse-soft">{metrics.clientsUpToDate}</p>
              <div className="flex items-center mt-1">
                <Activity className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600 font-medium">{((metrics.clientsUpToDate / metrics.totalActiveClients) * 100 || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagos Vencidos */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-red-200 hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg animate-pulse-soft">
              <AlertCircle className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-red-700">Pagos Vencidos</p>
              <p className="text-2xl lg:text-3xl font-bold text-red-900 animate-pulse-soft">{metrics.clientsOverdue}</p>
              <div className="flex items-center mt-1">
                <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                <span className="text-xs text-red-600 font-medium">{((metrics.clientsOverdue / metrics.totalActiveClients) * 100 || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vencen Pronto */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-yellow-200 hover-lift animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg animate-pulse-soft">
              <Clock className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-yellow-700">Vencen Pronto</p>
              <p className="text-2xl lg:text-3xl font-bold text-yellow-900 animate-pulse-soft">{metrics.clientsDueSoon}</p>
              <div className="flex items-center mt-1">
                <Clock className="h-3 w-3 text-yellow-500 mr-1" />
                <span className="text-xs text-yellow-600 font-medium">{((metrics.clientsDueSoon / metrics.totalActiveClients) * 100 || 0).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar alumnos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white shadow-sm transition-all duration-200 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Listas de atención */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Pagos Vencidos */}
        <div className="bg-gradient-to-br from-white to-red-50 rounded-xl shadow-lg border border-red-200">
          <div className="px-6 py-5 bg-gradient-to-r from-red-500 to-red-600 rounded-t-xl flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <AlertCircle className="h-5 w-5 text-white mr-3" />
              Pagos Vencidos ({getFilteredOverdueClients().length})
            </h3>
            {overdueClients.length > itemsPerPage && (
              <button
                onClick={() => setShowAllOverdue(!showAllOverdue)}
                className="flex items-center text-sm text-white hover:text-red-100 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors duration-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showAllOverdue ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
          </div>
          <div className="p-6">
            {renderOverdueClients()}
          </div>
        </div>

        {/* Vencen Pronto */}
        <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-lg border border-yellow-200">
          <div className="px-6 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-t-xl flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Clock className="h-5 w-5 text-white mr-3" />
              Vencen Pronto ({getFilteredDueSoonClients().length})
            </h3>
            {dueSoonClients.length > itemsPerPage && (
              <button
                onClick={() => setShowAllDueSoon(!showAllDueSoon)}
                className="flex items-center text-sm text-white hover:text-yellow-100 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors duration-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showAllDueSoon ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
          </div>
          <div className="p-6">
            {renderDueSoonClients()}
          </div>
        </div>

        {/* Pagos al Día */}
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-200">
          <div className="px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 rounded-t-xl flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <CheckCircle className="h-5 w-5 text-white mr-3" />
              Pagos al Día ({getFilteredUpToDateClients().length})
            </h3>
            {upToDateClients.length > itemsPerPage && (
              <button
                onClick={() => setShowAllUpToDate(!showAllUpToDate)}
                className="flex items-center text-sm text-white hover:text-green-100 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors duration-200"
              >
                <Eye className="h-4 w-4 mr-1" />
                {showAllUpToDate ? 'Ver menos' : 'Ver todos'}
              </button>
            )}
          </div>
          <div className="p-6">
            {renderUpToDateClients()}
          </div>
        </div>
      </div>
    </div>
  );

  // Funciones auxiliares para filtrado y renderizado
  function getFilteredOverdueClients() {
    return overdueClients.filter(client => 
      `${client.name} ${client.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  function getFilteredDueSoonClients() {
    return dueSoonClients.filter(client => 
      `${client.name} ${client.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  function getFilteredUpToDateClients() {
    return upToDateClients.filter(client => 
      `${client.name} ${client.surname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  function renderOverdueClients() {
    const filteredClients = getFilteredOverdueClients();
    
    if (filteredClients.length === 0) {
      return searchTerm ? (
        <p className="text-gray-500 text-center py-4">No se encontraron alumnos con pagos vencidos</p>
      ) : (
        <p className="text-gray-500 text-center py-4">¡Excelente! No hay pagos vencidos</p>
      );
    }

    const clientsToShow = showAllOverdue ? filteredClients : filteredClients.slice(0, itemsPerPage);
    
    return (
      <div className="space-y-3">
        {clientsToShow.map(client => (
          <div 
            key={client.id} 
            onClick={() => onClientClick?.(client.id)}
            className="group flex items-center justify-between p-5 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-red-200 hover:border-red-300 cursor-pointer transform hover:-translate-y-1"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg group-hover:text-red-700 transition-colors">{client.name} {client.surname}</p>
              <p className="text-sm text-gray-600 mt-1">Vencimiento: <span className="font-medium text-red-600">{format(new Date(client.payment_date), 'dd/MM/yyyy')}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
                Vencido
              </span>
              <ChevronRight className="h-5 w-5 text-red-400 group-hover:text-red-600 transition-colors" />
            </div>
          </div>
        ))}
        {!showAllOverdue && filteredClients.length > itemsPerPage && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllOverdue(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Ver {filteredClients.length - itemsPerPage} más...
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderDueSoonClients() {
    const filteredClients = getFilteredDueSoonClients();
    
    if (filteredClients.length === 0) {
      return searchTerm ? (
        <p className="text-gray-500 text-center py-4">No se encontraron alumnos con pagos próximos a vencer</p>
      ) : (
        <p className="text-gray-500 text-center py-4">No hay pagos próximos a vencer</p>
      );
    }

    const clientsToShow = showAllDueSoon ? filteredClients : filteredClients.slice(0, itemsPerPage);
    
    return (
      <div className="space-y-3">
        {clientsToShow.map(client => (
          <div 
            key={client.id} 
            onClick={() => onClientClick?.(client.id)}
            className="group flex items-center justify-between p-5 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-yellow-200 hover:border-yellow-300 cursor-pointer transform hover:-translate-y-1"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg group-hover:text-yellow-700 transition-colors">{client.name} {client.surname}</p>
              <p className="text-sm text-gray-600 mt-1">Vencimiento: <span className="font-medium text-yellow-600">{format(new Date(client.payment_date), 'dd/MM/yyyy')}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-md">
                Próximo
              </span>
              <ChevronRight className="h-5 w-5 text-yellow-400 group-hover:text-yellow-600 transition-colors" />
            </div>
          </div>
        ))}
        {!showAllDueSoon && filteredClients.length > itemsPerPage && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllDueSoon(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Ver {filteredClients.length - itemsPerPage} más...
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderUpToDateClients() {
    const filteredClients = getFilteredUpToDateClients();
    
    if (filteredClients.length === 0) {
      return searchTerm ? (
        <p className="text-gray-500 text-center py-4">No se encontraron alumnos con pagos al día</p>
      ) : (
        <p className="text-gray-500 text-center py-4">No hay alumnos con pagos al día</p>
      );
    }

    const clientsToShow = showAllUpToDate ? filteredClients : filteredClients.slice(0, itemsPerPage);
    
    return (
      <div className="space-y-3">
        {clientsToShow.map(client => (
          <div 
            key={client.id} 
            onClick={() => onClientClick?.(client.id)}
            className="group flex items-center justify-between p-5 bg-white rounded-xl hover:shadow-lg transition-all duration-300 border border-green-200 hover:border-green-300 cursor-pointer transform hover:-translate-y-1"
          >
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors">{client.name} {client.surname}</p>
              <p className="text-sm text-gray-600 mt-1">Próximo pago: <span className="font-medium text-green-600">{format(new Date(client.payment_date), 'dd/MM/yyyy')}</span></p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
                Al día
              </span>
              <ChevronRight className="h-5 w-5 text-green-400 group-hover:text-green-600 transition-colors" />
            </div>
          </div>
        ))}
        {!showAllUpToDate && filteredClients.length > itemsPerPage && (
          <div className="text-center pt-2">
            <button
              onClick={() => setShowAllUpToDate(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Ver {filteredClients.length - itemsPerPage} más...
            </button>
          </div>
        )}
      </div>
    );
  }
}
