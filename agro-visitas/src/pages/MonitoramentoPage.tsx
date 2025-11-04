import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Search, Bug, Calendar, MapPin, AlertTriangle, TrendingUp, Droplet } from 'lucide-react';
import NovaInspeccaoModal from '../components/NovaInspeccaoModal';

interface CultureInspection {
  id: string;
  talhao_nome: string;
  fazenda_nome: string;
  cultura_nome: string;
  data_inspecao: string;
  estagio_fenologico?: string;
  tipo_inspecao: string;
  num_pragas?: number;
  num_doencas?: number;
  nivel_risco?: string;
}

export default function MonitoramentoPage() {
  const { organization } = useAuth();
  const [inspecoes, setInspecoes] = useState<CultureInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (organization) {
      loadInspecoes();
    }
  }, [organization]);

  async function loadInspecoes() {
    if (!organization) return;

    try {
      setLoading(true);
      
      // Query real do Supabase
      const { data, error } = await supabase
        .from('culture_inspections')
        .select(`
          id,
          data_inspecao,
          tipo_inspecao,
          observacoes,
          talhao:talhoes!talhao_id(
            codigo,
            fazenda:fazendas!fazenda_id(nome)
          ),
          cultura:culturas!cultura_id(nome),
          phenology:phenology_observations(estagio_fenologico),
          pests:pest_observations(praga_nome, nivel_infestacao),
          diseases:disease_observations(doenca_nome, severidade)
        `)
        .eq('org_id', organization)
        .order('data_inspecao', { ascending: false });

      if (error) {
        console.error('Erro ao carregar inspeções:', error);
        // Tabela ainda não existe - mostrar lista vazia
        setInspecoes([]);
        return;
      }

      // Transformar dados para o formato esperado
      const transformedData = (data || []).map((item: any) => ({
        id: item.id,
        talhao_nome: item.talhao?.codigo || 'N/A',
        fazenda_nome: item.talhao?.fazenda?.nome || 'N/A',
        cultura_nome: item.cultura?.nome || 'N/A',
        data_inspecao: item.data_inspecao?.split('T')[0] || '',
        estagio_fenologico: item.phenology?.[0]?.estagio_fenologico,
        tipo_inspecao: item.tipo_inspecao || 'geral',
        num_pragas: item.pests?.length || 0,
        num_doencas: item.diseases?.length || 0,
        nivel_risco: calcularNivelRisco(item.pests, item.diseases)
      }));

      setInspecoes(transformedData);
    } catch (error) {
      console.error('Erro ao carregar inspeções:', error);
      setInspecoes([]);
    } finally {
      setLoading(false);
    }
  }

  function calcularNivelRisco(pests: any[], diseases: any[]) {
    const totalProblemas = (pests?.length || 0) + (diseases?.length || 0);
    if (totalProblemas === 0) return 'baixo';
    if (totalProblemas <= 2) return 'medio';
    if (totalProblemas <= 4) return 'alto';
    return 'critico';
  }

  const filteredInspecoes = inspecoes.filter((inspecao) => {
    const matchSearch = inspecao.talhao_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspecao.fazenda_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspecao.cultura_nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = filtroTipo === 'todos' || inspecao.tipo_inspecao === filtroTipo;
    
    return matchSearch && matchTipo;
  });

  const getRiskColor = (nivel?: string) => {
    switch (nivel) {
      case 'baixo':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medio':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'alto':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critico':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'pragas':
        return <Bug className="w-4 h-4" />;
      case 'doencas':
        return <AlertTriangle className="w-4 h-4" />;
      case 'fenologia':
        return <TrendingUp className="w-4 h-4" />;
      case 'deficit_hidrico':
        return <Droplet className="w-4 h-4" />;
      default:
        return <Bug className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoramento de Culturas</h1>
          <p className="mt-1 text-gray-600">Inspeções de campo, pragas, doenças e fenologia</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nova Inspeção
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Inspeções</p>
              <p className="text-2xl font-bold text-blue-900">{inspecoes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700 font-medium">Pragas Detectadas</p>
              <p className="text-2xl font-bold text-purple-900">
                {inspecoes.reduce((sum, i) => sum + (i.num_pragas || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Doenças Identificadas</p>
              <p className="text-2xl font-bold text-orange-900">
                {inspecoes.reduce((sum, i) => sum + (i.num_doencas || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-700 font-medium">Áreas de Risco</p>
              <p className="text-2xl font-bold text-red-900">
                {inspecoes.filter(i => i.nivel_risco === 'alto' || i.nivel_risco === 'critico').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar inspeções por talhão, fazenda ou cultura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroTipo === 'todos' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('pragas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroTipo === 'pragas' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pragas
            </button>
            <button
              onClick={() => setFiltroTipo('doencas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroTipo === 'doencas' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Doenças
            </button>
            <button
              onClick={() => setFiltroTipo('fenologia')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filtroTipo === 'fenologia' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fenologia
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Inspeções */}
      {filteredInspecoes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || filtroTipo !== 'todos' ? 'Nenhuma inspeção encontrada' : 'Nenhuma inspeção cadastrada'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filtroTipo !== 'todos'
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece realizando sua primeira inspeção de campo'
            }
          </p>
          {!searchTerm && filtroTipo === 'todos' && (
            <button 
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Cadastrar Primeira Inspeção
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInspecoes.map((inspecao) => (
            <div
              key={inspecao.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-green-200 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  inspecao.tipo_inspecao === 'pragas' ? 'bg-purple-100' :
                  inspecao.tipo_inspecao === 'doencas' ? 'bg-orange-100' :
                  inspecao.tipo_inspecao === 'fenologia' ? 'bg-blue-100' :
                  'bg-green-100'
                }`}>
                  {getTipoIcon(inspecao.tipo_inspecao)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{inspecao.talhao_nome}</h3>
                    {inspecao.nivel_risco && (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(inspecao.nivel_risco)}`}>
                        {inspecao.nivel_risco}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {inspecao.fazenda_nome}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                      {inspecao.cultura_nome}
                    </span>
                    {inspecao.estagio_fenologico && (
                      <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {inspecao.estagio_fenologico}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(inspecao.data_inspecao).toLocaleDateString('pt-BR')}
                  </p>

                  {(inspecao.num_pragas || inspecao.num_doencas) && (
                    <div className="flex gap-3 mt-2">
                      {inspecao.num_pragas && (
                        <p className="text-sm text-purple-700 flex items-center gap-1">
                          <Bug className="w-4 h-4" />
                          {inspecao.num_pragas} praga{inspecao.num_pragas > 1 ? 's' : ''}
                        </p>
                      )}
                      {inspecao.num_doencas && (
                        <p className="text-sm text-orange-700 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          {inspecao.num_doencas} doença{inspecao.num_doencas > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button className="w-full px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Ver Detalhes da Inspeção
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Nova Inspeção */}
      <NovaInspeccaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          loadInspecoes();
        }}
      />
    </div>
  );
}
