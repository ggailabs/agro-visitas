import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Cloud, CloudRain, CloudSnow, Wind, Droplets, Sun, AlertTriangle, MapPin, Calendar, Loader } from 'lucide-react';

interface ClimateEvent {
  id: string;
  occurred_at: string;
  event_type: string;
  intensidade?: number;
  unidade_symbol?: string;
  observacoes?: string;
  source_nome?: string;
  localizacao?: any;
}

const EVENT_ICONS: { [key: string]: any } = {
  chuva: CloudRain,
  geada: CloudSnow,
  granizo: CloudSnow,
  vendaval: Wind,
  seca: Sun,
  inundacao: Droplets,
  temperatura_extrema: AlertTriangle,
};

const EVENT_COLORS: { [key: string]: string } = {
  chuva: 'from-blue-500 to-blue-600',
  geada: 'from-cyan-500 to-blue-500',
  granizo: 'from-purple-500 to-indigo-600',
  vendaval: 'from-gray-500 to-gray-600',
  seca: 'from-yellow-500 to-orange-500',
  inundacao: 'from-blue-600 to-indigo-700',
  temperatura_extrema: 'from-red-500 to-orange-600',
};

const EVENT_LABELS: { [key: string]: string } = {
  chuva: 'Chuva',
  geada: 'Geada',
  granizo: 'Granizo',
  vendaval: 'Vendaval',
  seca: 'Seca',
  inundacao: 'Inundação',
  temperatura_extrema: 'Temperatura Extrema',
};

export default function ClimaPage() {
  const { organization } = useAuth();
  const [events, setEvents] = useState<ClimateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [stats, setStats] = useState({
    total: 0,
    last30Days: 0,
    byType: {} as { [key: string]: number }
  });

  useEffect(() => {
    if (organization) {
      loadEvents();
    }
  }, [organization]);

  async function loadEvents() {
    if (!organization) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('climate_events')
        .select(`
          id,
          occurred_at,
          event_type,
          intensidade,
          observacoes,
          localizacao,
          unit:units!unidade_id(symbol),
          source:climate_sources!source_id(nome)
        `)
        .or(`organization_id.eq.${organization},organization_id.is.null`)
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Erro ao carregar eventos climáticos:', error);
        setEvents([]);
        return;
      }

      const transformed = (data || []).map((item: any) => ({
        id: item.id,
        occurred_at: item.occurred_at,
        event_type: item.event_type,
        intensidade: item.intensidade,
        unidade_symbol: item.unit?.symbol,
        observacoes: item.observacoes,
        source_nome: item.source?.nome,
        localizacao: item.localizacao
      }));

      setEvents(transformed);
      calculateStats(transformed);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(eventData: ClimateEvent[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEvents = eventData.filter(
      (e) => new Date(e.occurred_at) >= thirtyDaysAgo
    );

    const byType: { [key: string]: number } = {};
    eventData.forEach((e) => {
      byType[e.event_type] = (byType[e.event_type] || 0) + 1;
    });

    setStats({
      total: eventData.length,
      last30Days: recentEvents.length,
      byType
    });
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      EVENT_LABELS[event.event_type]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'todos' || event.event_type === filterType;

    return matchesSearch && matchesType;
  });

  const eventTypes = Object.keys(EVENT_LABELS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Eventos Climáticos</h1>
                <p className="text-gray-600">Monitoramento de condições climáticas</p>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Registrar Evento
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Eventos</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Cloud className="w-10 h-10 text-blue-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Últimos 30 Dias</p>
                  <p className="text-3xl font-bold text-cyan-600">{stats.last30Days}</p>
                </div>
                <Calendar className="w-10 h-10 text-cyan-400" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo Mais Comum</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {Object.keys(stats.byType).length > 0
                      ? EVENT_LABELS[Object.keys(stats.byType).reduce((a, b) => 
                          stats.byType[a] > stats.byType[b] ? a : b
                        )] || 'N/A'
                      : 'N/A'
                    }
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos os Tipos</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {EVENT_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Timeline */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando eventos...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Cloud className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-500">Registre eventos climáticos para monitoramento</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const Icon = EVENT_ICONS[event.event_type] || Cloud;
              const colorClass = EVENT_COLORS[event.event_type] || 'from-gray-500 to-gray-600';
              
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-xl shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {EVENT_LABELS[event.event_type] || event.event_type}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(event.occurred_at).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        {event.intensidade && (
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Intensidade: {event.intensidade} {event.unidade_symbol}
                          </span>
                        )}
                        {event.source_nome && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Fonte: {event.source_nome}
                          </span>
                        )}
                      </div>

                      {event.observacoes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {event.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
