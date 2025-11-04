import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { VisitaTecnica, VisitaFoto, Cliente, Fazenda } from '../types/database';
import VisitCard from '../components/VisitCard';
import TimelineFilters from '../components/TimelineFilters';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  TrendingUp, 
  MapPin,
  Activity,
  BarChart3
} from 'lucide-react';

interface VisitaComFotos extends VisitaTecnica {
  fotos: VisitaFoto[];
  cliente?: Cliente;
}

interface FazendaComCliente extends Fazenda {
  clientes?: Cliente;
}

export default function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organization } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fazenda, setFazenda] = useState<FazendaComCliente | null>(null);
  const [visitas, setVisitas] = useState<VisitaComFotos[]>([]);
  
  // Estados dos filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState('todos');
  const [tipoSelecionado, setTipoSelecionado] = useState('todos');
  const [statusSelecionado, setStatusSelecionado] = useState('todos');

  useEffect(() => {
    if (id && organization) {
      loadTimelineData();
    }
  }, [id, organization]);

  async function loadTimelineData() {
    if (!id || !organization) return;

    try {
      setLoading(true);
      setError('');

      // Carregar dados da fazenda
      const { data: fazendaData, error: fazendaError } = await supabase
        .from('fazendas')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single();

      if (fazendaError) {
        if (fazendaError.code === 'PGRST116') {
          setError('Fazenda não encontrada');
          return;
        }
        throw fazendaError;
      }

      // Carregar dados do cliente da fazenda
      let fazendaComCliente = fazendaData;
      if (fazendaData.cliente_id) {
        const { data: clienteData } = await supabase
          .from('clientes')
          .select('nome')
          .eq('id', fazendaData.cliente_id)
          .single();
        
        fazendaComCliente = { 
          ...fazendaData, 
          clientes: clienteData 
        };
      }

      setFazenda(fazendaComCliente);

      // Carregar visitas da fazenda
      const { data: visitasData, error: visitasError } = await supabase
        .from('visitas_tecnicas')
        .select('*')
        .eq('fazenda_id', id)
        .eq('organization_id', organization.id)
        .order('data_visita', { ascending: false });

      if (visitasError) {
        throw visitasError;
      }

      // Processar dados das visitas com fotos e clientes
      const visitasProcessadas = await Promise.all(
        (visitasData || []).map(async (visita: any) => {
          // Carregar fotos da visita
          const { data: fotosData } = await supabase
            .from('visita_fotos')
            .select('id, url, titulo, file_name, created_at')
            .eq('visita_id', visita.id);

          // Carregar dados do cliente
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('id, nome, email')
            .eq('id', visita.cliente_id)
            .single();

          return {
            ...visita,
            fotos: fotosData || [],
            cliente: clienteData
          };
        })
      );

      setVisitas(visitasProcessadas);

    } catch (err: any) {
      console.error('Erro ao carregar timeline:', err);
      setError('Erro ao carregar timeline da fazenda');
    } finally {
      setLoading(false);
    }
  }

  // Função para filtrar visitas por período
  const filtrarPorPeriodo = (visita: VisitaTecnica, periodo: string): boolean => {
    if (periodo === 'todos') return true;

    const dataVisita = new Date(visita.data_visita);
    const agora = new Date();
    
    switch (periodo) {
      case '30d':
        return (agora.getTime() - dataVisita.getTime()) <= (30 * 24 * 60 * 60 * 1000);
      case '3m':
        return (agora.getTime() - dataVisita.getTime()) <= (90 * 24 * 60 * 60 * 1000);
      case '6m':
        return (agora.getTime() - dataVisita.getTime()) <= (180 * 24 * 60 * 60 * 1000);
      case '1a':
        return (agora.getTime() - dataVisita.getTime()) <= (365 * 24 * 60 * 60 * 1000);
      default:
        return true;
    }
  };

  // Visitas filtradas
  const visitasFiltradas = useMemo(() => {
    return visitas.filter(visita => {
      const passaPeriodo = filtrarPorPeriodo(visita, periodoSelecionado);
      const passaTipo = tipoSelecionado === 'todos' || visita.tipo_visita === tipoSelecionado;
      const passaStatus = statusSelecionado === 'todos' || visita.status === statusSelecionado;
      
      return passaPeriodo && passaTipo && passaStatus;
    });
  }, [visitas, periodoSelecionado, tipoSelecionado, statusSelecionado]);

  // Estatísticas da timeline
  const estatisticas = useMemo(() => {
    const total = visitasFiltradas.length;
    const realizadas = visitasFiltradas.filter(v => v.status === 'realizada').length;
    const totalFotos = visitasFiltradas.reduce((acc, v) => acc + v.fotos.length, 0);
    const ultimaVisita = visitasFiltradas[0]?.data_visita;

    return {
      total,
      realizadas,
      totalFotos,
      ultimaVisita
    };
  }, [visitasFiltradas]);

  function limparFiltros() {
    setPeriodoSelecionado('todos');
    setTipoSelecionado('todos');
    setStatusSelecionado('todos');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !fazenda) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <MapPin className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            {error || 'Fazenda não encontrada'}
          </h2>
          <p className="text-red-700 mb-4">
            Não foi possível carregar a timeline desta fazenda.
          </p>
          <button
            onClick={() => navigate('/fazendas')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Fazendas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/fazendas')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-green-600" />
                Timeline de Visitas
              </h1>
              <p className="text-gray-600 mt-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                {fazenda.nome}
                {fazenda.clientes && (
                  <span className="ml-2 text-gray-500">
                    • Produtor: {fazenda.clientes.nome}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <Link
            to="/visitas/nova"
            state={{ fazendaId: fazenda.id, clienteId: fazenda.cliente_id }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Visita
          </Link>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total de Visitas</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{estatisticas.total}</p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">Realizadas</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{estatisticas.realizadas}</p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Total de Fotos</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{estatisticas.totalFotos}</p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Última Visita</span>
            </div>
            <p className="text-sm font-bold text-orange-900">
              {estatisticas.ultimaVisita 
                ? new Date(estatisticas.ultimaVisita).toLocaleDateString('pt-BR')
                : 'Nenhuma'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <TimelineFilters
        periodoSelecionado={periodoSelecionado}
        onPeriodoChange={setPeriodoSelecionado}
        tipoSelecionado={tipoSelecionado}
        onTipoChange={setTipoSelecionado}
        statusSelecionado={statusSelecionado}
        onStatusChange={setStatusSelecionado}
        totalVisitas={visitasFiltradas.length}
        onLimparFiltros={limparFiltros}
      />

      {/* Timeline */}
      {visitasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma visita encontrada
          </h3>
          <p className="text-gray-600 mb-6">
            {visitas.length === 0 
              ? 'Esta fazenda ainda não possui visitas registradas.'
              : 'Nenhuma visita corresponde aos filtros selecionados.'
            }
          </p>
          <Link
            to="/visitas/nova"
            state={{ fazendaId: fazenda.id, clienteId: fazenda.cliente_id }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-5 h-5" />
            Registrar Primeira Visita
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {visitasFiltradas.map((visita, index) => (
            <div key={visita.id} className="relative">
              {/* Linha da Timeline */}
              {index < visitasFiltradas.length - 1 && (
                <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-green-300 to-green-100"></div>
              )}
              
              {/* Indicador da Timeline */}
              <div className="absolute left-6 top-6 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md z-10"></div>
              
              {/* Card da Visita */}
              <div className="ml-16">
                <VisitCard
                  visita={visita}
                  fotos={visita.fotos}
                  cliente={visita.cliente}
                  isRecent={index === 0}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}