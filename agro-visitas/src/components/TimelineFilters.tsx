import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

interface TimelineFiltersProps {
  periodoSelecionado: string;
  onPeriodoChange: (periodo: string) => void;
  tipoSelecionado: string;
  onTipoChange: (tipo: string) => void;
  statusSelecionado: string;
  onStatusChange: (status: string) => void;
  totalVisitas: number;
  onLimparFiltros: () => void;
}

export default function TimelineFilters({
  periodoSelecionado,
  onPeriodoChange,
  tipoSelecionado,
  onTipoChange,
  statusSelecionado,
  onStatusChange,
  totalVisitas,
  onLimparFiltros
}: TimelineFiltersProps) {
  
  const periodos = [
    { value: 'todos', label: 'Todos os períodos' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '3m', label: 'Últimos 3 meses' },
    { value: '6m', label: 'Últimos 6 meses' },
    { value: '1a', label: 'Último ano' },
  ];

  const tiposVisita = [
    { value: 'todos', label: 'Todos os tipos' },
    { value: 'Inspeção', label: 'Inspeção' },
    { value: 'Consultoria', label: 'Consultoria' },
    { value: 'Monitoramento', label: 'Monitoramento' },
    { value: 'Coleta de Dados', label: 'Coleta de Dados' },
    { value: 'Treinamento', label: 'Treinamento' },
  ];

  const statusOptions = [
    { value: 'todos', label: 'Todos os status' },
    { value: 'realizada', label: 'Realizada' },
    { value: 'planejada', label: 'Planejada' },
    { value: 'cancelada', label: 'Cancelada' },
  ];

  const hasActiveFilters = periodoSelecionado !== 'todos' || 
                          tipoSelecionado !== 'todos' || 
                          statusSelecionado !== 'todos';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros da Timeline</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {totalVisitas} visita{totalVisitas !== 1 ? 's' : ''} encontrada{totalVisitas !== 1 ? 's' : ''}
          </span>
          
          {hasActiveFilters && (
            <button
              onClick={onLimparFiltros}
              className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro de Período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Período
          </label>
          <select
            value={periodoSelecionado}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {periodos.map((periodo) => (
              <option key={periodo.value} value={periodo.value}>
                {periodo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Visita
          </label>
          <select
            value={tipoSelecionado}
            onChange={(e) => onTipoChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {tiposVisita.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={statusSelecionado}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Indicadores Visuais */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Filtros ativos:</span>
            
            {periodoSelecionado !== 'todos' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {periodos.find(p => p.value === periodoSelecionado)?.label}
              </span>
            )}
            
            {tipoSelecionado !== 'todos' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {tipoSelecionado}
              </span>
            )}
            
            {statusSelecionado !== 'todos' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {statusOptions.find(s => s.value === statusSelecionado)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}