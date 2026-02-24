import React, { useCallback, useEffect, useState } from 'react';
import { X, AlertTriangle, Users, ArrowRight, Check, Search } from 'lucide-react';
import { api, ClientWithRelations } from '../../lib/api';
import { Location } from '../../types';
import { toast } from 'react-hot-toast';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceLocationId: string;
  sourceLocationName: string;
  onSuccess: () => void;
}

interface TransferReport {
  sourceLocation: { id: string; name: string };
  targetLocation: { id: string; name: string };
  currentTargetCount: number;
  targetCapacityTotal: number | null;
  projectedCount: number;
  requestedTransferMode: 'all' | 'selection';
  clients: Array<{ id: string; name: string; surname: string; dni: string; action: 'moved' | 'already_in_target' }>;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  sourceLocationId,
  sourceLocationName,
  onSuccess,
}) => {
  const [step, setStep] = useState<'selection' | 'confirmation' | 'result'>('selection');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [targetLocations, setTargetLocations] = useState<Location[]>([]);
  const [sourceClients, setSourceClients] = useState<ClientWithRelations[]>([]);
  const [targetCounts, setTargetCounts] = useState<Record<string, number>>({});

  const [targetLocationId, setTargetLocationId] = useState<string>('');
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [targetCapacityTotal, setTargetCapacityTotal] = useState('');
  const [report, setReport] = useState<TransferReport | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const allLocations = await api.locations.list();
      setTargetLocations(allLocations.filter(l => l.id !== sourceLocationId));

      const [activeClients, inactiveClients] = await Promise.all([
        api.clients.list(true),
        api.clients.list(false)
      ]);

      const allClients = [...activeClients, ...inactiveClients];

      const counts: Record<string, number> = {};
      allClients.forEach(client => {
        client.locations.forEach(loc => {
          counts[loc.id] = (counts[loc.id] || 0) + 1;
        });
      });
      setTargetCounts(counts);

      const clientsInLocation = allClients.filter(c => 
        c.locations.some(l => l.id === sourceLocationId)
      );

      setSourceClients(clientsInLocation);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar alumnos y sedes.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [sourceLocationId, onClose]);

  useEffect(() => {
    if (isOpen && sourceLocationId) {
      setStep('selection');
      setSelectedClientIds(new Set());
      setSearchTerm('');
      setTargetLocationId('');
      setTargetCapacityTotal('');
      setReport(null);
      setSuccessMessage('');
      loadData();
    }
  }, [isOpen, sourceLocationId, loadData]);

  const handleSelectAll = () => {
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set());
    } else {
      const newSelected = new Set(filteredClients.map(c => c.id));
      setSelectedClientIds(newSelected);
    }
  };

  const handleToggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClientIds);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const handleTransfer = async () => {
    if (sourceClients.length > 0 && !targetLocationId) {
      toast.error('Debes seleccionar una sede de destino.');
      return;
    }
    if (sourceClients.length > 0 && targetCapacityTotal.trim() === '') {
      toast.error('Debes indicar la capacidad total de la sede destino.');
      return;
    }

    const selectedClients = sourceClients.filter(client => selectedClientIds.has(client.id));
    const selectedMoveCount = selectedClients.filter(
      client => !client.locations.some(l => l.id === targetLocationId)
    ).length;
    const currentTargetCount = targetCounts[targetLocationId] || 0;
    const capacityTotal = targetCapacityTotal.trim() === '' ? null : Number(targetCapacityTotal);
    const projectedCount = currentTargetCount + selectedMoveCount;
    if (capacityTotal !== null && projectedCount > capacityTotal) {
      toast.error('La sede destino no tiene capacidad suficiente.');
      return;
    }

    setProcessing(true);
    try {
      const clientIds = Array.from(selectedClientIds);

      if (sourceClients.length === 0) {
        await api.locations.delete(sourceLocationId);
        setSuccessMessage('Sede eliminada correctamente.');
      } else {
        const response = await api.locations.transferAndDelete({
          sourceLocationId,
          targetLocationId,
          clientIds: clientIds,
          targetCapacityTotal: capacityTotal
        });
        const reportData =
          response.report && typeof response.report === 'object'
            ? (response.report as TransferReport)
            : null;
        setReport(reportData);
        setSuccessMessage(response.message || 'Operación completada con éxito.');
      }

      onSuccess();
      setStep('result');
    } catch (error: unknown) {
      console.error('Error en operación:', error);
      const message = error instanceof Error ? error.message : 'Error al procesar la solicitud.';
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredClients = sourceClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.dni.includes(searchTerm)
  );

  const selectedClients = sourceClients.filter(client => selectedClientIds.has(client.id));
  const selectedMoveCount = selectedClients.filter(
    client => !client.locations.some(l => l.id === targetLocationId)
  ).length;
  const currentTargetCount = targetCounts[targetLocationId] || 0;
  const capacityTotalNumber = targetCapacityTotal.trim() === '' ? null : Number(targetCapacityTotal);
  const projectedCount = currentTargetCount + selectedMoveCount;

  const targetLocationName = targetLocations.find(l => l.id === targetLocationId)?.name || 'Seleccionar';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Eliminar Sede y Transferir Alumnos</h2>
              <p className="text-red-100 text-sm">Sede: {sourceLocationName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
            </div>
          ) : step === 'selection' ? (
            <div className="space-y-6">
              {/* Selección de Destino */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Seleccionar Sede de Destino {sourceClients.length > 0 && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                  disabled={sourceClients.length === 0}
                >
                  <option value="">-- Seleccionar Sede --</option>
                  {targetLocations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.address})</option>
                  ))}
                </select>
                {sourceClients.length === 0 ? (
                  <p className="text-sm text-green-600 mt-2 font-medium flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    No hay alumnos en esta sede. Puedes proceder a eliminarla directamente.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        2. Capacidad total de la sede destino <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={targetCapacityTotal}
                        onChange={(e) => setTargetCapacityTotal(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                        placeholder="Ej: 120"
                      />
                    </div>
                    {targetLocationId && (
                      <div className="text-xs text-gray-600">
                        Alumnos actuales en destino: <strong>{currentTargetCount}</strong> ·
                        A transferir: <strong>{selectedMoveCount}</strong> ·
                        Proyectado: <strong>{projectedCount}</strong>
                        {capacityTotalNumber !== null && (
                          <> · Capacidad total: <strong>{capacityTotalNumber}</strong></>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selección de Alumnos */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">3. Seleccionar Alumnos</span>
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                      {selectedClientIds.size} seleccionados
                    </span>
                  </div>
                  
                  <div className="flex w-full sm:w-auto gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar alumno..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2 border-b border-gray-100 bg-white flex justify-between items-center">
                  <button 
                    onClick={handleSelectAll}
                    className="text-sm text-red-600 font-medium hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    {selectedClientIds.size === filteredClients.length && filteredClients.length > 0 ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                  <span className="text-xs text-gray-500 mr-3">
                    Total: {filteredClients.length} alumnos
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredClients.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      No se encontraron alumnos en esta sede.
                    </div>
                  ) : (
                    filteredClients.map(client => (
                      <div 
                        key={client.id}
                        onClick={() => handleToggleClient(client.id)}
                        className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                          selectedClientIds.has(client.id) 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                          selectedClientIds.has(client.id) ? 'bg-red-600 border-red-600' : 'border-gray-300'
                        }`}>
                          {selectedClientIds.has(client.id) && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{client.name} {client.surname}</p>
                          <p className="text-xs text-gray-500">DNI: {client.dni}</p>
                        </div>
                        <div className="flex gap-2">
                           {client.groups.map(g => (
                             <span key={g.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                               {g.name}
                             </span>
                           ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : step === 'confirmation' ? (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Confirmación de Seguridad
                </h3>
                <p className="text-red-700 mb-4">
                  Estás a punto de eliminar la sede <strong>{sourceLocationName}</strong> permanentemente.
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="bg-white p-4 rounded-lg border border-red-100 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Resumen de la operación:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-red-500 mr-2" />
                      <span>Sede a Eliminar: <strong>{sourceLocationName}</strong></span>
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-green-500 mr-2" />
                      <span>Sede de Destino: <strong>{targetLocationName}</strong></span>
                    </li>
                    <li className="flex items-center">
                      <Users className="h-4 w-4 text-blue-500 mr-2" />
                      <span>Alumnos a Transferir: <strong>{selectedClientIds.size}</strong></span>
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-purple-500 mr-2" />
                      <span>
                        Capacidad total destino: <strong>{capacityTotalNumber ?? '-'}</strong> ·
                        Proyectado: <strong>{projectedCount}</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                {sourceClients.length > selectedClientIds.size && (
                   <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 mb-4">
                     <strong>Atención:</strong> Hay {sourceClients.length - selectedClientIds.size} alumnos en la sede que <strong>NO</strong> han sido seleccionados.
                     Estos alumnos perderán su asignación a esta sede y quedarán desvinculados de la misma.
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Resultado</h3>
                <p className="text-gray-700">{successMessage}</p>
              </div>
              {report && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">
                    Reporte detallado de transferencia
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Alumno</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">DNI</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-600">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {report.clients.map((client) => (
                          <tr key={client.id}>
                            <td className="px-4 py-2 text-gray-800">{client.name} {client.surname}</td>
                            <td className="px-4 py-2 text-gray-600">{client.dni}</td>
                            <td className="px-4 py-2 text-gray-600">
                              {client.action === 'moved' ? 'Transferido' : 'Ya estaba en destino'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          {step === 'selection' ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (sourceClients.length > 0 && !targetLocationId) {
                    toast.error('Selecciona una sede destino');
                    return;
                  }
                  if (sourceClients.length > 0 && targetCapacityTotal.trim() === '') {
                    toast.error('Indicá la capacidad total de la sede destino');
                    return;
                  }
                  if (capacityTotalNumber !== null && projectedCount > capacityTotalNumber) {
                    toast.error('La sede destino no tiene capacidad suficiente');
                    return;
                  }
                  setStep('confirmation');
                }}
                disabled={(sourceClients.length > 0 && !targetLocationId) || loading}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-lg hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </>
          ) : step === 'confirmation' ? (
            <>
              <button
                onClick={() => setStep('selection')}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                disabled={processing}
              >
                Atrás
              </button>
              <button
                onClick={handleTransfer}
                disabled={processing}
                className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow-lg hover:shadow-red-200 transition-all disabled:opacity-50 flex items-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  'Confirmar y Eliminar'
                )}
              </button>
            </>
          ) : (
            <>
              <div />
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
